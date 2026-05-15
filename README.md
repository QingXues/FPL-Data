# FPL Fantasy Premium League

A data analytics platform for Fantasy Premier League (FPL) that collects and visualizes player and league statistics.

## Architecture

- **Collector** (`collector/`): Python async data collector that fetches FPL API data and stores it in Supabase.
- **Web** (`web/`): Next.js 15 application that displays player stats, classic league stats, and head-to-head league stats.
- **Database**: Supabase PostgreSQL with season-scoped tables.

## Setup

### 1. Supabase Database

Run `supabase_schema.sql` in your Supabase SQL Editor to create all required tables.

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Also copy to `web/.env.local`:

```bash
cp .env.example web/.env.local
```

### 3. Install Dependencies

**Python collector:**

```bash
cd collector
pip install -r requirements.txt
```

**Next.js web:**

```bash
cd web
npm install
```

### 4. Run Development Servers

**Start the Next.js dev server:**

```bash
cd web
npm run dev
```

**Collect a manager manually:**

```bash
cd collector
python -m src.main --mode collect --team-id <YOUR_TEAM_ID>
```

**Collect a league manually:**

```bash
cd collector
python -m src.main --mode collect --league-id <LEAGUE_ID> --league-type classic
```

**Daily incremental update:**

```bash
cd collector
python -m src.main --mode daily-update
```

## Usage Flow

1. Open the web app (default `http://localhost:3000`).
2. Enter your FPL Team ID on the home page.
3. If data exists in the database, it loads immediately. Otherwise, the collector runs and the page shows a loading state.
4. On the player detail page, you can see all your stats and a list of leagues you participate in.
5. Click on a league:
   - If already collected, it opens the league stats page.
   - If not collected, it triggers collection (leagues with >10 teams are rejected).

## GitHub Actions

The repository includes `.github/workflows/daily-update.yml` to run the daily incremental update automatically. Configure the following secrets in your repository settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

## Data Collected

### Player Stats
- Total points, average per gameweek, best/worst gameweek
- Points per gameweek trend chart
- Overall rank trend chart
- Player contribution leaderboard (which player earned the most points)
- Captain points and captain pick success rate
- Bench points
- Chip usage history and performance vs average
- Transfer history and total transfer cost

### Classic League Stats
- Current standings table
- Total points trend chart (all teams)
- Rank trend chart (all teams)
- Per-gameweek best and worst scores

### H2H League Stats
- Standings with wins/draws/losses, goal difference, points
- Head-to-head matrix (wins/draws/losses and scores)
- Per-gameweek match results
