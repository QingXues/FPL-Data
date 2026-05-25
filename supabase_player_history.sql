-- Migrate existing player_history rows to season-aware lookups.
-- This file assumes public.player_history already exists.

ALTER TABLE player_history ADD COLUMN IF NOT EXISTS season INT;
UPDATE player_history SET season = 26 WHERE season IS NULL;
ALTER TABLE player_history ALTER COLUMN season SET DEFAULT 26;
ALTER TABLE player_history ALTER COLUMN season SET NOT NULL;
