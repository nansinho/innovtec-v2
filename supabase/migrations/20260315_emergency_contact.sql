-- ============================================================
-- Ajouter les champs contact d'urgence au profil
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT DEFAULT '';
