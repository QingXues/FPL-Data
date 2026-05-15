"""Core collection logic."""

from __future__ import annotations

import asyncio
from typing import Any

from .api import FPLClient
from .db import FPLDatabase
from .models import (
    Chip,
    ClassicLeagueStanding,
    GameweekPick,
    GameweekScore,
    H2HMatch,
    League,
    Manager,
    ManagerLeague,
    Transfer,
    manager_from_entry,
)


CONCURRENT_REQUESTS = 10


class Collector:
    def __init__(self) -> None:
        self.api = FPLClient()
        self.db = FPLDatabase()
        self.semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

    async def close(self) -> None:
        await self.api.close()

    async def _safe_get(self, coro):
        async with self.semaphore:
            return await coro

    # ------------------------------------------------------------------
    # Manager collection
    # ------------------------------------------------------------------
    async def collect_manager(self, team_id: int) -> Manager:
        """Full collection for a single manager."""
        # 1. Basic info
        entry = await self._safe_get(self.api.entry(team_id))
        manager = manager_from_entry(entry)

        # 2. History (current season gameweek scores)
        history = await self._safe_get(self.api.entry_history(team_id))
        scores: list[GameweekScore] = []
        chips: list[Chip] = []
        events_collected = 0

        for gw in history.get("current", []):
            scores.append(GameweekScore(
                team_id=team_id,
                event=gw["event"],
                points=gw["points"],
                total_points=gw["total_points"],
                rank=gw.get("rank"),
                bank=gw["bank"],
                value=gw["value"],
                event_transfers=gw["event_transfers"],
                event_transfers_cost=gw["event_transfers_cost"],
                points_on_bench=gw["points_on_bench"],
            ))
            events_collected = max(events_collected, gw["event"])

        for chip in history.get("chips", []):
            chips.append(Chip(
                team_id=team_id,
                event=chip["event"],
                name=chip["name"],
            ))

        # 3. Picks per event
        picks: list[GameweekPick] = []
        pick_tasks = []
        event_numbers = [gw["event"] for gw in history.get("current", [])]
        for event in event_numbers:
            pick_tasks.append(self._safe_get(self.api.entry_event_picks(team_id, event)))

        pick_results = await asyncio.gather(*pick_tasks, return_exceptions=True)
        for event, result in zip(event_numbers, pick_results):
            if isinstance(result, Exception):
                continue
            for p in result.get("picks", []):
                picks.append(GameweekPick(
                    team_id=team_id,
                    event=event,
                    element=p["element"],
                    position=p["position"],
                    multiplier=p["multiplier"],
                    is_captain=p.get("is_captain", False),
                    is_vice_captain=p.get("is_vice_captain", False),
                    points=p.get("points"),
                ))

        # 4. Transfers
        transfers_raw = await self._safe_get(self.api.entry_transfers(team_id))
        transfers: list[Transfer] = []
        for t in transfers_raw:
            transfers.append(Transfer(
                team_id=team_id,
                event=t["event"],
                element_in=t["element_in"],
                element_out=t["element_out"],
                element_in_cost=t["element_in_cost"],
                element_out_cost=t["element_out_cost"],
            ))

        # 5. League memberships
        manager_leagues: list[ManagerLeague] = []
        for league_type in ("classic", "h2h"):
            for league in entry.get("leagues", {}).get(league_type, []):
                manager_leagues.append(ManagerLeague(
                    team_id=team_id,
                    league_id=league["id"],
                ))

        # 6. Write to DB
        self.db.upsert_managers([manager])
        self.db.upsert_gameweek_scores(scores)
        self.db.upsert_gameweek_picks(picks)
        self.db.delete_transfers(team_id)
        self.db.insert_transfers(transfers)
        self.db.delete_chips(team_id)
        self.db.insert_chips(chips)
        self.db.upsert_manager_leagues(manager_leagues)
        self.db.update_manager_last_event(team_id, events_collected)

        return manager

    # ------------------------------------------------------------------
    # League collection
    # ------------------------------------------------------------------
    async def _collect_classic_league(self, league_id: int) -> League:
        standings_data = await self._safe_get(self.api.classic_league_standings(league_id))
        results = standings_data.get("standings", {}).get("results", [])
        team_count = len(results)

        if team_count > 10:
            raise ValueError(f"Classic league {league_id} has {team_count} teams (>10)")

        league = League(
            league_id=league_id,
            league_name=standings_data.get("league", {}).get("name", ""),
            league_type="classic",
            team_count=team_count,
        )

        # Collect all members first so we have their gameweek_scores
        team_ids = [r["entry"] for r in results]
        for tid in team_ids:
            if not self.db.get_manager(tid):
                await self.collect_manager(tid)

        # Re-fetch scores from DB and compute per-event standings
        from .db import FPLDatabase
        db = FPLDatabase()
        all_scores: list[dict[str, Any]] = []
        for tid in team_ids:
            resp = db.client.table("gameweek_scores").select("*").eq("team_id", tid).eq("season", 26).execute()
            all_scores.extend(resp.data or [])

        # Group by event
        event_scores: dict[int, list[dict[str, Any]]] = {}
        for s in all_scores:
            event_scores.setdefault(s["event"], []).append(s)

        standings: list[ClassicLeagueStanding] = []
        for event, scores in event_scores.items():
            # Sort by total_points descending
            sorted_scores = sorted(scores, key=lambda x: x["total_points"], reverse=True)
            for rank, s in enumerate(sorted_scores, start=1):
                standings.append(ClassicLeagueStanding(
                    league_id=league_id,
                    team_id=s["team_id"],
                    event=event,
                    rank=rank,
                    total=s["total_points"],
                    event_total=s["points"],
                ))

        self.db.upsert_leagues([league])
        self.db.upsert_classic_standings(standings)
        return league

    async def _collect_h2h_league(self, league_id: int) -> League:
        standings_data = await self._safe_get(self.api.h2h_league_standings(league_id))
        results = standings_data.get("standings", {}).get("results", [])
        team_count = len(results)

        if team_count > 10:
            raise ValueError(f"H2H league {league_id} has {team_count} teams (>10)")

        league = League(
            league_id=league_id,
            league_name=standings_data.get("league", {}).get("name", ""),
            league_type="h2h",
            team_count=team_count,
        )

        # Collect all members
        team_ids = [r["entry"] for r in results]
        for tid in team_ids:
            if not self.db.get_manager(tid):
                await self.collect_manager(tid)

        # Fetch all H2H matches (paginated)
        matches: list[H2HMatch] = []
        page = 1
        while True:
            data = await self._safe_get(self.api.h2h_league_matches(league_id, page))
            for m in data.get("results", []):
                winner = m.get("winner")
                # winner can be entry_1, entry_2, or null for draw
                matches.append(H2HMatch(
                    league_id=league_id,
                    event=m["event"],
                    entry_1=m["entry_1"],
                    entry_1_points=m["entry_1_points"],
                    entry_2=m["entry_2"],
                    entry_2_points=m["entry_2_points"],
                    winner=winner if winner else None,
                ))
            if not data.get("has_next"):
                break
            page += 1

        self.db.upsert_leagues([league])
        self.db.upsert_h2h_matches(matches)
        return league

    async def collect_league(self, league_id: int, league_type: str) -> League:
        if league_type == "classic":
            return await self._collect_classic_league(league_id)
        elif league_type == "h2h":
            return await self._collect_h2h_league(league_id)
        else:
            raise ValueError(f"Unknown league type: {league_type}")

    # ------------------------------------------------------------------
    # Daily incremental update
    # ------------------------------------------------------------------
    async def daily_update(self) -> None:
        bootstrap = await self.api.bootstrap_static()
        # Find current event
        current_event = None
        for ev in bootstrap.get("events", []):
            if ev.get("is_current"):
                current_event = ev["id"]
                break
        if current_event is None:
            # Fallback to last finished event
            for ev in reversed(bootstrap.get("events", [])):
                if ev.get("finished"):
                    current_event = ev["id"]
                    break

        if current_event is None:
            print("No current event found.")
            return

        print(f"Current event: {current_event}")

        # Update managers
        managers = self.db.get_all_managers()
        for m in managers:
            last_event = m.get("last_event_collected", 0)
            if last_event < current_event:
                print(f"Updating manager {m['team_id']} (last: {last_event})")
                await self.collect_manager(m["team_id"])

        # Update leagues
        leagues = self.db.get_all_leagues()
        for l in leagues:
            print(f"Updating league {l['league_id']} ({l['league_type']})")
            await self.collect_league(l["league_id"], l["league_type"])

        print("Daily update completed.")
