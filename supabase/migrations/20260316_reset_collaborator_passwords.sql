-- ============================================================
-- Migration: Reset des mots de passe collaborateurs via API GoTrue
-- Le hash bcrypt de crypt() PostgreSQL n'est pas compatible avec GoTrue.
-- On utilise l'extension http pour appeler l'API admin Supabase.
-- ============================================================

-- IMPORTANT: Remplacez ces 2 valeurs avant d'exécuter !
-- Trouvez-les dans Supabase Dashboard > Settings > API
\set supabase_url 'https://VOTRE_URL.supabase.co'
\set service_role_key 'eyVOTRE_SERVICE_ROLE_KEY'

CREATE EXTENSION IF NOT EXISTS http;

SELECT http((
  'PUT',
  :'supabase_url' || '/auth/v1/admin/users/' || u.id::text,
  ARRAY[
    http_header('apikey', :'service_role_key'),
    http_header('Authorization', 'Bearer ' || :'service_role_key')
  ],
  'application/json',
  '{"password": "Innovtec2025!"}'
)::http_request)
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'collaborateur';
