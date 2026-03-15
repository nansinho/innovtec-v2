-- Migration: Create bonnes_pratiques table for QSE best practices
-- Date: 2026-03-15

CREATE TABLE IF NOT EXISTS bonnes_pratiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pillar TEXT NOT NULL DEFAULT 'securite',
  category TEXT DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  chantier TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonnes_pratiques_pillar ON bonnes_pratiques(pillar);
CREATE INDEX IF NOT EXISTS idx_bonnes_pratiques_created ON bonnes_pratiques(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER tr_bonnes_pratiques_updated
  BEFORE UPDATE ON bonnes_pratiques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE bonnes_pratiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde lit les bonnes pratiques"
  ON bonnes_pratiques FOR SELECT USING (true);

CREATE POLICY "QSE et Admin gèrent les bonnes pratiques"
  ON bonnes_pratiques FOR ALL USING (is_admin_rh_or_qse());
