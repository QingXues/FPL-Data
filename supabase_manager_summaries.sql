-- Manager summary aggregates
-- Run this after supabase_schema.sql to support precomputed player stats.

CREATE TABLE IF NOT EXISTS manager_summaries (
    team_id INT NOT NULL,
    captain_points INT NOT NULL DEFAULT 0,
    bench_points INT NOT NULL DEFAULT 0,
    season INT NOT NULL DEFAULT 26,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, season)
);

ALTER TABLE manager_summaries DROP COLUMN IF EXISTS captain_successes;
ALTER TABLE manager_summaries DROP COLUMN IF EXISTS captain_picks;

ALTER TABLE manager_summaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'manager_summaries' AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON manager_summaries FOR SELECT USING (true);
    END IF;
END $$;
