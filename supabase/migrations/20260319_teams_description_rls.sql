-- Add description column to teams if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add RLS policies for teams mutations (insert, update, delete)
-- Only admin/rh roles can modify teams
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'teams_insert' AND tablename = 'teams') THEN
    CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'teams_update' AND tablename = 'teams') THEN
    CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh')));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'teams_delete' AND tablename = 'teams') THEN
    CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh')));
  END IF;
END $$;
