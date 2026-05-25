-- FPL Data Platform Schema (Season 26)
-- Run this in your Supabase SQL Editor

-- Managers (collected players)
CREATE TABLE IF NOT EXISTS managers (
    team_id INT NOT NULL,
    player_name TEXT NOT NULL,
    season INT NOT NULL DEFAULT 26,
    last_event_collected INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, season)
);

-- Leagues
CREATE TABLE IF NOT EXISTS leagues (
    league_id INT NOT NULL,
    league_name TEXT NOT NULL,
    league_type TEXT NOT NULL CHECK (league_type IN ('classic', 'h2h')),
    season INT NOT NULL DEFAULT 26,
    team_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (league_id, season)
);

-- Manager-League relationships
CREATE TABLE IF NOT EXISTS manager_leagues (
    team_id INT NOT NULL,
    league_id INT NOT NULL,
    season INT NOT NULL DEFAULT 26,
    PRIMARY KEY (team_id, league_id, season)
);

-- Gameweek scores
CREATE TABLE IF NOT EXISTS gameweek_scores (
    team_id INT NOT NULL,
    event INT NOT NULL,
    points INT NOT NULL DEFAULT 0,
    total_points INT NOT NULL DEFAULT 0,
    rank INT,
    overall_rank INT,
    bank INT NOT NULL DEFAULT 0,
    value INT NOT NULL DEFAULT 0,
    event_transfers INT NOT NULL DEFAULT 0,
    event_transfers_cost INT NOT NULL DEFAULT 0,
    points_on_bench INT NOT NULL DEFAULT 0,
    season INT NOT NULL DEFAULT 26,
    PRIMARY KEY (team_id, event, season)
);

-- Gameweek picks (squad details)
CREATE TABLE IF NOT EXISTS gameweek_picks (
    team_id INT NOT NULL,
    event INT NOT NULL,
    element INT NOT NULL,
    position INT NOT NULL,
    multiplier INT NOT NULL DEFAULT 1,
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    is_vice_captain BOOLEAN NOT NULL DEFAULT FALSE,
    points INT,
    season INT NOT NULL DEFAULT 26,
    PRIMARY KEY (team_id, event, element, season)
);

-- Transfers
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL,
    event INT NOT NULL,
    element_in INT NOT NULL,
    element_out INT NOT NULL,
    element_in_cost INT NOT NULL DEFAULT 0,
    element_out_cost INT NOT NULL DEFAULT 0,
    season INT NOT NULL DEFAULT 26
);
CREATE INDEX IF NOT EXISTS idx_transfers_team ON transfers(team_id, season);

-- Chips used
CREATE TABLE IF NOT EXISTS chips (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL,
    event INT NOT NULL,
    name TEXT NOT NULL CHECK (name IN ('bb', 'tc', 'wc', 'fh')),
    season INT NOT NULL DEFAULT 26
);
CREATE INDEX IF NOT EXISTS idx_chips_team ON chips(team_id, season);

-- Classic league standings (per event)
CREATE TABLE IF NOT EXISTS classic_league_standings (
    league_id INT NOT NULL,
    team_id INT NOT NULL,
    event INT NOT NULL,
    rank INT NOT NULL,
    total INT NOT NULL DEFAULT 0,
    event_total INT NOT NULL DEFAULT 0,
    season INT NOT NULL DEFAULT 26,
    PRIMARY KEY (league_id, team_id, event, season)
);

-- H2H matches
CREATE TABLE IF NOT EXISTS h2h_matches (
    league_id INT NOT NULL,
    event INT NOT NULL,
    entry_1 INT NOT NULL,
    entry_1_points INT NOT NULL DEFAULT 0,
    entry_2 INT NOT NULL,
    entry_2_points INT NOT NULL DEFAULT 0,
    winner INT,
    season INT NOT NULL DEFAULT 26,
    PRIMARY KEY (league_id, event, entry_1, entry_2, season)
);

-- Enable RLS for public read access (optional, adjust as needed)
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameweek_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameweek_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE classic_league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2h_matches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'managers' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON managers FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'leagues' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON leagues FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'manager_leagues' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON manager_leagues FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'gameweek_scores' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON gameweek_scores FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'gameweek_picks' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON gameweek_picks FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'transfers' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON transfers FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'chips' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON chips FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'classic_league_standings' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON classic_league_standings FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'h2h_matches' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON h2h_matches FOR SELECT USING (true);
    END IF;
END $$;

-- Relationships for Supabase embedded selects.
-- CREATE TABLE IF NOT EXISTS does not add constraints to existing tables, so
-- these blocks are safe to rerun after the initial schema has already been applied.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'manager_leagues_team_fk'
    ) THEN
        ALTER TABLE manager_leagues
        ADD CONSTRAINT manager_leagues_team_fk
        FOREIGN KEY (team_id, season) REFERENCES managers(team_id, season)
        ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'manager_leagues_league_fk'
    ) THEN
        ALTER TABLE manager_leagues
        ADD CONSTRAINT manager_leagues_league_fk
        FOREIGN KEY (league_id, season) REFERENCES leagues(league_id, season)
        ON DELETE CASCADE;
    END IF;
END $$;
