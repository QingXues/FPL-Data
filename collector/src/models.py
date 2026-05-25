"""Pydantic models for FPL data."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


SEASON = 26


class Manager(BaseModel):
    team_id: int
    player_name: str
    season: int = Field(default=SEASON)
    last_event_collected: int = Field(default=0)


class League(BaseModel):
    league_id: int
    league_name: str
    league_type: str  # "classic" or "h2h"
    season: int = Field(default=SEASON)
    team_count: int = Field(default=0)


class ManagerLeague(BaseModel):
    team_id: int
    league_id: int
    season: int = Field(default=SEASON)


class GameweekScore(BaseModel):
    team_id: int
    event: int
    points: int
    total_points: int
    rank: int | None = None
    overall_rank: int | None = None
    bank: int
    value: int
    event_transfers: int
    event_transfers_cost: int
    points_on_bench: int
    season: int = Field(default=SEASON)


class GameweekPick(BaseModel):
    team_id: int
    event: int
    player_id: int
    position: int
    multiplier: int
    is_captain: bool
    is_vice_captain: bool
    season: int = Field(default=SEASON)


class ManagerSummary(BaseModel):
    team_id: int
    captain_points: int = Field(default=0)
    bench_points: int = Field(default=0)
    season: int = Field(default=SEASON)


class Transfer(BaseModel):
    team_id: int
    event: int
    element_in: int
    element_out: int
    element_in_cost: int
    element_out_cost: int
    season: int = Field(default=SEASON)


class Chip(BaseModel):
    team_id: int
    event: int
    name: str  # bb, tc, wc, fh
    season: int = Field(default=SEASON)


class ClassicLeagueStanding(BaseModel):
    league_id: int
    team_id: int
    event: int
    rank: int
    total: int
    event_total: int
    season: int = Field(default=SEASON)


class H2HMatch(BaseModel):
    league_id: int
    event: int
    entry_1: int
    entry_1_points: int
    entry_2: int
    entry_2_points: int
    winner: int | None = None
    season: int = Field(default=SEASON)


def manager_from_entry(entry: dict[str, Any]) -> Manager:
    return Manager(
        team_id=entry["id"],
        player_name=f"{entry.get('player_first_name', '')} {entry.get('player_last_name', '')}".strip(),
    )
