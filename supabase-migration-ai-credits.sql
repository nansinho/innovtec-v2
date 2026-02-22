-- ============================================================
-- INNOVTEC Réseaux — Migration : Crédits IA + Contenu QSE
-- ============================================================

-- ==========================================
-- 1. TABLE AI_CREDITS
-- ==========================================

CREATE TABLE ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_limit INTEGER NOT NULL DEFAULT 30,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);

CREATE INDEX idx_ai_credits_user ON ai_credits(user_id, period);
CREATE TRIGGER tr_ai_credits_updated BEFORE UPDATE ON ai_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 2. TABLE QSE_CONTENT
-- ==========================================

CREATE TABLE qse_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '[]',
  source_file_url TEXT DEFAULT '',
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qse_content_type ON qse_content(type);
CREATE TRIGGER tr_qse_content_updated BEFORE UPDATE ON qse_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE qse_content ENABLE ROW LEVEL SECURITY;

-- AI Credits
CREATE POLICY "Voir ses crédits" ON ai_credits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin voit tous les crédits" ON ai_credits FOR SELECT USING (is_admin_or_rh());
CREATE POLICY "Système gère les crédits" ON ai_credits FOR ALL USING (auth.uid() IS NOT NULL);

-- QSE Content
CREATE POLICY "Tout le monde lit le contenu QSE" ON qse_content FOR SELECT USING (true);
CREATE POLICY "QSE/Admin gèrent le contenu" ON qse_content FOR ALL USING (is_admin_rh_or_qse());
