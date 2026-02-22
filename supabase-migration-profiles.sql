-- ============================================================
-- MIGRATION : Profil utilisateur enrichi
-- Ajoute date_of_birth, hire_date aux profiles
-- Crée les tables user_experiences, user_diplomas, user_formations
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- 1. Nouvelles colonnes sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date DATE;

-- 2. Table expériences professionnelles
CREATE TABLE IF NOT EXISTS user_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT DEFAULT '',
  date_start DATE NOT NULL,
  date_end DATE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table diplômes
CREATE TABLE IF NOT EXISTS user_diplomas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  school TEXT NOT NULL,
  year_obtained INTEGER,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table formations personnelles / certifications
CREATE TABLE IF NOT EXISTS user_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organisme TEXT DEFAULT '',
  date_obtained DATE,
  expiry_date DATE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_user_experiences_user ON user_experiences(user_id, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_user_diplomas_user ON user_diplomas(user_id, year_obtained DESC);
CREATE INDEX IF NOT EXISTS idx_user_formations_user ON user_formations(user_id, date_obtained DESC);

-- 6. Triggers updated_at
CREATE TRIGGER tr_user_experiences_updated BEFORE UPDATE ON user_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_user_diplomas_updated BEFORE UPDATE ON user_diplomas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_user_formations_updated BEFORE UPDATE ON user_formations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_diplomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_formations ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS
DROP POLICY IF EXISTS "Voir les expériences des profils actifs" ON user_experiences;
DROP POLICY IF EXISTS "Gérer ses expériences" ON user_experiences;
DROP POLICY IF EXISTS "Admin/RH gèrent les expériences" ON user_experiences;
CREATE POLICY "Voir les expériences des profils actifs" ON user_experiences FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_active = true));
CREATE POLICY "Gérer ses expériences" ON user_experiences FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les expériences" ON user_experiences FOR ALL USING (is_admin_or_rh());

DROP POLICY IF EXISTS "Voir les diplômes des profils actifs" ON user_diplomas;
DROP POLICY IF EXISTS "Gérer ses diplômes" ON user_diplomas;
DROP POLICY IF EXISTS "Admin/RH gèrent les diplômes" ON user_diplomas;
CREATE POLICY "Voir les diplômes des profils actifs" ON user_diplomas FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_active = true));
CREATE POLICY "Gérer ses diplômes" ON user_diplomas FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les diplômes" ON user_diplomas FOR ALL USING (is_admin_or_rh());

DROP POLICY IF EXISTS "Voir les formations perso des profils actifs" ON user_formations;
DROP POLICY IF EXISTS "Gérer ses formations perso" ON user_formations;
DROP POLICY IF EXISTS "Admin/RH gèrent les formations perso" ON user_formations;
CREATE POLICY "Voir les formations perso des profils actifs" ON user_formations FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_active = true));
CREATE POLICY "Gérer ses formations perso" ON user_formations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les formations perso" ON user_formations FOR ALL USING (is_admin_or_rh());
