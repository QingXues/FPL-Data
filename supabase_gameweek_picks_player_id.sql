-- Migrate gameweek_picks from FPL element naming to player_id.
-- This file assumes public.gameweek_picks already exists.

ALTER TABLE gameweek_picks ADD COLUMN IF NOT EXISTS player_id INT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'gameweek_picks'
            AND column_name = 'element'
    ) THEN
        UPDATE gameweek_picks SET player_id = element WHERE player_id IS NULL;
    END IF;
END $$;

ALTER TABLE gameweek_picks ALTER COLUMN player_id SET NOT NULL;
ALTER TABLE gameweek_picks DROP CONSTRAINT IF EXISTS gameweek_picks_pkey;
ALTER TABLE gameweek_picks DROP COLUMN IF EXISTS points;
ALTER TABLE gameweek_picks DROP COLUMN IF EXISTS element;
ALTER TABLE gameweek_picks ADD PRIMARY KEY (team_id, event, player_id, season);
