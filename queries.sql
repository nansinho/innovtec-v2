-- ============================================================
-- INNOVTEC Réseaux — Toutes les queries Supabase des actions
-- Référence : src/actions/*.ts
-- ============================================================

-- ==========================================
-- AUTH (src/actions/auth.ts)
-- ==========================================

-- getProfile : profil de l'utilisateur connecté
SELECT * FROM profiles WHERE id = auth.uid() LIMIT 1;

-- signUp : upsert du profil après création du user auth
INSERT INTO profiles (id, email, first_name, last_name)
VALUES (:user_id, :email, :first_name, :last_name)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- ==========================================
-- TODOS (src/actions/todos.ts)
-- ==========================================

-- getUserTodos : tâches de l'utilisateur triées par position
SELECT * FROM todos
WHERE user_id = auth.uid()
ORDER BY position ASC;

-- toggleTodo : lire le statut actuel
SELECT status FROM todos WHERE id = :todo_id LIMIT 1;

-- toggleTodo : basculer le statut
UPDATE todos
SET status = CASE WHEN status = 'done' THEN 'pending' ELSE 'done' END
WHERE id = :todo_id;

-- ==========================================
-- FEED (src/actions/feed.ts)
-- ==========================================

-- getFeedPosts : posts récents avec info auteur (JOIN)
SELECT
  fp.*,
  p.first_name AS author_first_name,
  p.last_name AS author_last_name,
  p.avatar_url AS author_avatar_url
FROM feed_posts fp
LEFT JOIN profiles p ON p.id = fp.author_id
ORDER BY fp.created_at DESC
LIMIT 20;

-- createFeedPost : publier un post
INSERT INTO feed_posts (author_id, content, image_url)
VALUES (auth.uid(), :content, :image_url);

-- ==========================================
-- EVENTS (src/actions/events.ts)
-- ==========================================

-- getUpcomingEvents : prochains événements
SELECT * FROM events
WHERE start_at >= NOW()
ORDER BY start_at ASC
LIMIT 10;

-- getTodayEvents : événements du jour
SELECT * FROM events
WHERE start_at >= DATE_TRUNC('day', NOW())
  AND start_at < DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
ORDER BY start_at ASC;

-- ==========================================
-- TIMEBITS (src/actions/timebits.ts)
-- ==========================================

-- getActiveTimebit : pointage en cours (non terminé)
SELECT * FROM timebits
WHERE user_id = auth.uid()
  AND ended_at IS NULL
LIMIT 1;

-- startTimebit : démarrer un pointage
INSERT INTO timebits (user_id, mode)
VALUES (auth.uid(), :mode);

-- stopTimebit : lire l'heure de début
SELECT started_at FROM timebits WHERE id = :timebit_id LIMIT 1;

-- stopTimebit : arrêter le pointage
UPDATE timebits
SET ended_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
WHERE id = :timebit_id;

-- ==========================================
-- GALLERY (src/actions/gallery.ts)
-- ==========================================

-- getRecentPhotos : dernières photos
SELECT * FROM gallery_photos
ORDER BY created_at DESC
LIMIT 6;

-- ==========================================
-- DOCUMENTS (src/actions/documents.ts)
-- ==========================================

-- getDocuments : documents avec info uploader (JOIN)
SELECT
  d.*,
  p.first_name AS uploader_first_name,
  p.last_name AS uploader_last_name
FROM documents d
LEFT JOIN profiles p ON p.id = d.uploaded_by
ORDER BY d.created_at DESC
LIMIT 50;

-- getDocuments avec filtre catégorie
SELECT
  d.*,
  p.first_name AS uploader_first_name,
  p.last_name AS uploader_last_name
FROM documents d
LEFT JOIN profiles p ON p.id = d.uploaded_by
WHERE d.category = :category
ORDER BY d.created_at DESC
LIMIT 50;

-- ==========================================
-- NEWS (src/actions/news.ts)
-- ==========================================

-- getPublishedNews : toutes les news publiées avec auteur
SELECT
  n.*,
  p.first_name AS author_first_name,
  p.last_name AS author_last_name
FROM news n
LEFT JOIN profiles p ON p.id = n.author_id
WHERE n.is_published = true
ORDER BY n.published_at DESC;

-- getCarouselNews : news du carrousel
SELECT * FROM news
WHERE is_carousel = true
  AND is_published = true
ORDER BY published_at DESC
LIMIT 5;
