-- ============================================================
-- Fix: Ajouter les entrées auth.identities manquantes
-- pour les utilisateurs créés par INSERT direct dans auth.users
-- (import WordPress). Sans identities, GoTrue ne les retrouve pas.
-- ============================================================

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  u.id,          -- id
  u.id,          -- user_id
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true
  ),
  'email',       -- provider
  u.id::text,    -- provider_id
  now(),
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
WHERE i.id IS NULL;
