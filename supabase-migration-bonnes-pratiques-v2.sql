-- Migration: Add missing fields and fix RLS for bonnes_pratiques table

-- 1. Add new columns
ALTER TABLE bonnes_pratiques
  ADD COLUMN IF NOT EXISTS cover_photo TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cost_impact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS environmental_impact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS safety_impact TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_file_url TEXT DEFAULT '';

-- 2. Add missing INSERT policy (allows authenticated users to create bonnes pratiques)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bonnes_pratiques'
    AND policyname = 'Authentifiés créent des bonnes pratiques'
  ) THEN
    CREATE POLICY "Authentifiés créent des bonnes pratiques"
      ON bonnes_pratiques FOR INSERT WITH CHECK (author_id = auth.uid());
  END IF;
END $$;
