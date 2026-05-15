"""CLI entry point."""

from __future__ import annotations

import argparse
import asyncio
import sys

from dotenv import load_dotenv

from .collector import Collector


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="FPL Data Collector")
    parser.add_argument(
        "--mode",
        choices=["collect", "daily-update"],
        required=True,
        help="Collection mode",
    )
    parser.add_argument("--team-id", type=int, help="Team ID to collect")
    parser.add_argument("--league-id", type=int, help="League ID to collect")
    parser.add_argument("--league-type", choices=["classic", "h2h"], help="League type")
    return parser.parse_args()


async def main() -> int:
    load_dotenv()
    args = parse_args()
    collector = Collector()

    try:
        if args.mode == "collect":
            if args.team_id:
                print(f"Collecting manager {args.team_id}...")
                manager = await collector.collect_manager(args.team_id)
                print(f"Done: {manager.player_name} (team_id={manager.team_id})")
            elif args.league_id and args.league_type:
                print(f"Collecting {args.league_type} league {args.league_id}...")
                league = await collector.collect_league(args.league_id, args.league_type)
                print(f"Done: {league.league_name} ({league.team_count} teams)")
            else:
                print("Error: --team-id or (--league-id + --league-type) required for collect mode.")
                return 1
        elif args.mode == "daily-update":
            await collector.daily_update()
    except Exception as e:
        print(f"Error: {e}")
        return 1
    finally:
        await collector.close()

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
