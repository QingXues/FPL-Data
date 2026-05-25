-- Gameweek overall rank
-- Run this after supabase_schema.sql to add total ranking after each gameweek.

ALTER TABLE gameweek_scores ADD COLUMN IF NOT EXISTS overall_rank INT;
