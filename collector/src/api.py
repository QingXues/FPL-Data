"""FPL API client."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

BASE_URL = "https://fantasy.premierleague.com/api"


class FPLClient:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=30.0, headers={
            "User-Agent": "Mozilla/5.0 (compatible; FPLDataCollector/1.0)"
        })

    async def close(self) -> None:
        await self.client.aclose()

    async def _get(self, path: str) -> dict[str, Any]:
        resp = await self.client.get(f"{BASE_URL}/{path}")
        resp.raise_for_status()
        return resp.json()

    async def bootstrap_static(self) -> dict[str, Any]:
        return await self._get("bootstrap-static/")

    async def entry(self, team_id: int) -> dict[str, Any]:
        return await self._get(f"entry/{team_id}/")

    async def entry_history(self, team_id: int) -> dict[str, Any]:
        return await self._get(f"entry/{team_id}/history/")

    async def entry_event_picks(self, team_id: int, event: int) -> dict[str, Any]:
        return await self._get(f"entry/{team_id}/event/{event}/picks/")

    async def entry_transfers(self, team_id: int) -> list[dict[str, Any]]:
        return await self._get(f"entry/{team_id}/transfers/")

    async def element_summary(self, element_id: int) -> dict[str, Any]:
        return await self._get(f"element-summary/{element_id}/")

    async def classic_league_standings(self, league_id: int, page: int = 1) -> dict[str, Any]:
        return await self._get(f"leagues-classic/{league_id}/standings/?page_standings={page}&page_new_entries=1")

    async def h2h_league_standings(self, league_id: int, page: int = 1) -> dict[str, Any]:
        return await self._get(f"leagues-h2h/{league_id}/standings/?page_standings={page}&page_new_entries=1")

    async def h2h_league_matches(self, league_id: int, page: int = 1) -> dict[str, Any]:
        return await self._get(f"leagues-h2h-matches/league/{league_id}/?page={page}")
