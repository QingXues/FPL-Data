"""Supabase database client."""

from __future__ import annotations

import os
from typing import Any

from supabase import Client, create_client

from .models import (
    Chip,
    ClassicLeagueStanding,
    GameweekPick,
    GameweekScore,
    H2HMatch,
    League,
    Manager,
    ManagerLeague,
    ManagerSummary,
    Transfer,
)


class FPLDatabase:
    def __init__(self) -> None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        self.client: Client = create_client(url, key)

    # ------------------------------------------------------------------
    # Managers
    # ------------------------------------------------------------------
    def get_manager(self, team_id: int, season: int = 26) -> dict[str, Any] | None:
        resp = (
            self.client.table("managers")
            .select("*")
            .eq("team_id", team_id)
            .eq("season", season)
            .limit(1)
            .execute()
        )
        return resp.data[0] if resp.data else None

    def upsert_managers(self, managers: list[Manager]) -> None:
        if not managers:
            return
        data = [m.model_dump() for m in managers]
        self.client.table("managers").upsert(data, on_conflict="team_id,season").execute()

    def update_manager_last_event(self, team_id: int, last_event: int, season: int = 26) -> None:
        self.client.table("managers").update({
            "last_event_collected": last_event,
        }).eq("team_id", team_id).eq("season", season).execute()

    def upsert_manager_summary(self, summary: ManagerSummary) -> None:
        self.client.table("manager_summaries").upsert(
            summary.model_dump(),
            on_conflict="team_id,season",
        ).execute()

    # ------------------------------------------------------------------
    # Leagues
    # ------------------------------------------------------------------
    def get_league(self, league_id: int, season: int = 26) -> dict[str, Any] | None:
        resp = (
            self.client.table("leagues")
            .select("*")
            .eq("league_id", league_id)
            .eq("season", season)
            .limit(1)
            .execute()
        )
        return resp.data[0] if resp.data else None

    def upsert_leagues(self, leagues: list[League]) -> None:
        if not leagues:
            return
        data = [l.model_dump() for l in leagues]
        self.client.table("leagues").upsert(data, on_conflict="league_id,season").execute()

    # ------------------------------------------------------------------
    # Manager-Leagues
    # ------------------------------------------------------------------
    def upsert_manager_leagues(self, items: list[ManagerLeague]) -> None:
        if not items:
            return
        data = [i.model_dump() for i in items]
        self.client.table("manager_leagues").upsert(data, on_conflict="team_id,league_id,season").execute()

    # ------------------------------------------------------------------
    # Gameweek scores
    # ------------------------------------------------------------------
    def upsert_gameweek_scores(self, scores: list[GameweekScore]) -> None:
        if not scores:
            return
        data = [s.model_dump() for s in scores]
        self.client.table("gameweek_scores").upsert(data, on_conflict="team_id,event,season").execute()

    # ------------------------------------------------------------------
    # Gameweek picks
    # ------------------------------------------------------------------
    def upsert_gameweek_picks(self, picks: list[GameweekPick]) -> None:
        if not picks:
            return
        data = [p.model_dump() for p in picks]
        self.client.table("gameweek_picks").upsert(data, on_conflict="team_id,event,player_id,season").execute()

    def get_player_history_points(
        self,
        event_player_ids: set[tuple[int, int]],
        season: int = 26,
    ) -> dict[tuple[int, int], int]:
        if not event_player_ids:
            return {}

        events = sorted({event for event, _ in event_player_ids})
        player_ids = sorted({player_id for _, player_id in event_player_ids})
        resp = (
            self.client.table("player_history")
            .select("player_id, round, total_points")
            .in_("round", events)
            .in_("player_id", player_ids)
            .eq("season", season)
            .execute()
        )

        points: dict[tuple[int, int], int] = {}
        for row in resp.data or []:
            key = (row["round"], row["player_id"])
            points[key] = points.get(key, 0) + (row.get("total_points") or 0)
        return points

    # ------------------------------------------------------------------
    # Transfers
    # ------------------------------------------------------------------
    def delete_transfers(self, team_id: int, season: int = 26) -> None:
        self.client.table("transfers").delete().eq("team_id", team_id).eq("season", season).execute()

    def insert_transfers(self, transfers: list[Transfer]) -> None:
        if not transfers:
            return
        data = [t.model_dump() for t in transfers]
        self.client.table("transfers").insert(data).execute()

    # ------------------------------------------------------------------
    # Chips
    # ------------------------------------------------------------------
    def delete_chips(self, team_id: int, season: int = 26) -> None:
        self.client.table("chips").delete().eq("team_id", team_id).eq("season", season).execute()

    def insert_chips(self, chips: list[Chip]) -> None:
        if not chips:
            return
        data = [c.model_dump() for c in chips]
        self.client.table("chips").insert(data).execute()

    # ------------------------------------------------------------------
    # Classic league standings
    # ------------------------------------------------------------------
    def upsert_classic_standings(self, standings: list[ClassicLeagueStanding]) -> None:
        if not standings:
            return
        data = [s.model_dump() for s in standings]
        self.client.table("classic_league_standings").upsert(data, on_conflict="league_id,team_id,event,season").execute()

    # ------------------------------------------------------------------
    # H2H matches
    # ------------------------------------------------------------------
    def upsert_h2h_matches(self, matches: list[H2HMatch]) -> None:
        if not matches:
            return
        data = [m.model_dump() for m in matches]
        self.client.table("h2h_matches").upsert(data, on_conflict="league_id,event,entry_1,entry_2,season").execute()

    # ------------------------------------------------------------------
    # Helpers for daily update
    # ------------------------------------------------------------------
    def get_all_managers(self, season: int = 26) -> list[dict[str, Any]]:
        resp = self.client.table("managers").select("*").eq("season", season).execute()
        return resp.data or []

    def get_all_leagues(self, season: int = 26) -> list[dict[str, Any]]:
        resp = self.client.table("leagues").select("*").eq("season", season).execute()
        return resp.data or []
