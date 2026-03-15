-- ============================================================
-- Table job_titles : liste des postes prédéfinis
-- Les admin/RH peuvent en ajouter depuis l'interface
-- ============================================================

CREATE TABLE IF NOT EXISTS job_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Postes BTP / Travaux
INSERT INTO job_titles (label) VALUES
  ('Chef de chantier'),
  ('Conducteur de travaux'),
  ('Technicien fibre optique'),
  ('Technicien réseau'),
  ('Technicien télécom'),
  ('Technicien de maintenance'),
  ('Monteur câbleur'),
  ('Tireur de câble'),
  ('Soudeur fibre optique'),
  ('Électricien'),
  ('Maçon VRD'),
  ('Conducteur d''engins'),
  ('Manoeuvre'),
  ('Chef d''équipe'),
  ('Responsable QSE'),
  ('Responsable technique'),
  ('Chargé d''affaires'),
  ('Chargé d''études'),
  ('Dessinateur / Projeteur'),
  ('Ingénieur travaux'),
  ('Géomètre'),
  -- Postes Administratifs
  ('Directeur général'),
  ('Directeur technique'),
  ('Directeur administratif et financier'),
  ('Responsable RH'),
  ('Assistant(e) RH'),
  ('Assistant(e) administratif(ve)'),
  ('Comptable'),
  ('Contrôleur de gestion'),
  ('Secrétaire'),
  ('Responsable achats'),
  ('Chargé(e) de communication'),
  ('Responsable informatique'),
  ('Apprenti(e)'),
  ('Stagiaire')
ON CONFLICT (label) DO NOTHING;
