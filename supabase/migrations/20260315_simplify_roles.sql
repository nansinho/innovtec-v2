-- ============================================================
-- Simplifier les rôles : migrer tout vers collaborateur sauf admin
-- L'enum SQL reste inchangé pour compatibilité, le contrôle
-- se fait côté application (UI n'expose que admin + collaborateur)
-- ============================================================

UPDATE profiles SET role = 'collaborateur' WHERE role NOT IN ('admin', 'collaborateur');
