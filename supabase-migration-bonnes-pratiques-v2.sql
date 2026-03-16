-- Migration: Add missing fields to bonnes_pratiques table
-- Fields: difficulty, priority, cost_impact, environmental_impact, safety_impact, source_file_url

ALTER TABLE bonnes_pratiques
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cost_impact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS environmental_impact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS safety_impact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_file_url TEXT DEFAULT '';
