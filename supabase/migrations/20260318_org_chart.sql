-- Ajouter la relation hiérarchique pour l'organigramme
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour les requêtes de subordination
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);
