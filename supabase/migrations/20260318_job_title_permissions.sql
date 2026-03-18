-- ============================================================
-- Table job_title_permissions : permissions par poste
-- Permet de définir quelles actions sont autorisées pour chaque poste
-- L'admin a toujours toutes les permissions (bypass côté application)
-- ============================================================

CREATE TABLE IF NOT EXISTS job_title_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title_id UUID NOT NULL REFERENCES job_titles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_title_id, permission)
);

ALTER TABLE job_title_permissions ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les authentifiés (nécessaire pour les checks côté app)
CREATE POLICY "Lire les permissions" ON job_title_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seuls les admins modifient les permissions
CREATE POLICY "Admin gère les permissions" ON job_title_permissions
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================
-- Seed : permissions par défaut pour les postes existants
-- ============================================================

-- Directeurs : toutes les permissions
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_users'), ('manage_news'), ('manage_qse'), ('manage_formations'),
         ('manage_events'), ('manage_documents'), ('manage_teams'), ('manage_settings'),
         ('view_logs'), ('manage_conges'), ('view_admin')
) AS p(permission)
WHERE jt.label IN ('Directeur général', 'Directeur technique', 'Directeur administratif et financier')
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Responsable RH / Assistant(e) RH : gestion utilisateurs, équipes, formations, congés
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_users'), ('manage_teams'), ('manage_formations'),
         ('manage_conges'), ('view_admin'), ('view_logs'), ('manage_news')
) AS p(permission)
WHERE jt.label IN ('Responsable RH', 'Assistant(e) RH')
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Responsable QSE : gestion QSE, documents
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_qse'), ('manage_documents'), ('view_admin'), ('manage_news')
) AS p(permission)
WHERE jt.label = 'Responsable QSE'
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Chefs : événements, documents
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_events'), ('manage_documents')
) AS p(permission)
WHERE jt.label IN ('Chef de chantier', 'Chef d''équipe', 'Conducteur de travaux')
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Responsable technique / Chargé d'affaires : événements, documents, QSE
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_events'), ('manage_documents'), ('manage_qse')
) AS p(permission)
WHERE jt.label IN ('Responsable technique', 'Chargé d''affaires', 'Ingénieur travaux')
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Chargé(e) de communication : gestion news
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_news'), ('manage_events')
) AS p(permission)
WHERE jt.label = 'Chargé(e) de communication'
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Responsable informatique : paramètres, logs
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_settings'), ('view_logs'), ('view_admin'), ('manage_users')
) AS p(permission)
WHERE jt.label = 'Responsable informatique'
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Responsable achats : documents
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_documents')
) AS p(permission)
WHERE jt.label = 'Responsable achats'
ON CONFLICT (job_title_id, permission) DO NOTHING;

-- Comptable / Contrôleur de gestion : documents
INSERT INTO job_title_permissions (job_title_id, permission)
SELECT jt.id, p.permission
FROM job_titles jt
CROSS JOIN (
  VALUES ('manage_documents')
) AS p(permission)
WHERE jt.label IN ('Comptable', 'Contrôleur de gestion')
ON CONFLICT (job_title_id, permission) DO NOTHING;
