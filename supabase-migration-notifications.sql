-- ============================================================
-- INNOVTEC Réseaux — Migration : Notifications, Blog, Anniversaires
-- ============================================================
-- Script IDEMPOTENT : peut être exécuté plusieurs fois sans erreur.

-- ==========================================
-- 1. TYPES ENUM
-- ==========================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'news', 'event', 'birthday', 'comment',
    'conge', 'danger', 'formation', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 2. TABLE NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  link TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ==========================================
-- 3. TABLE NEWS_VIEWS (comptage des vues)
-- ==========================================

CREATE TABLE IF NOT EXISTS news_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_news_views_news ON news_views(news_id);

-- ==========================================
-- 4. TABLE NEWS_COMMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_comments_news ON news_comments(news_id, created_at DESC);

-- ==========================================
-- 5. TABLE BIRTHDAY_WISHES
-- ==========================================

CREATE TABLE IF NOT EXISTS birthday_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT 'Joyeux anniversaire !',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_birthday_wishes_to ON birthday_wishes(to_user_id, year);

-- ==========================================
-- 6. RLS POLICIES (idempotent: drop then create)
-- ==========================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_wishes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Voir ses notifications" ON notifications;
DROP POLICY IF EXISTS "Gérer ses notifications" ON notifications;
DROP POLICY IF EXISTS "Admin crée des notifications" ON notifications;
DROP POLICY IF EXISTS "Supprimer ses notifications" ON notifications;
DROP POLICY IF EXISTS "Voir les vues" ON news_views;
DROP POLICY IF EXISTS "Enregistrer une vue" ON news_views;
DROP POLICY IF EXISTS "Voir les commentaires news" ON news_comments;
DROP POLICY IF EXISTS "Commenter une news" ON news_comments;
DROP POLICY IF EXISTS "Supprimer son commentaire news" ON news_comments;
DROP POLICY IF EXISTS "Voir les voeux" ON birthday_wishes;
DROP POLICY IF EXISTS "Envoyer des voeux" ON birthday_wishes;

-- Notifications : chacun voit les siennes
CREATE POLICY "Voir ses notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Gérer ses notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin crée des notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Supprimer ses notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- News views
CREATE POLICY "Voir les vues" ON news_views FOR SELECT USING (true);
CREATE POLICY "Enregistrer une vue" ON news_views FOR INSERT WITH CHECK (user_id = auth.uid());

-- News comments
CREATE POLICY "Voir les commentaires news" ON news_comments FOR SELECT USING (true);
CREATE POLICY "Commenter une news" ON news_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Supprimer son commentaire news" ON news_comments FOR DELETE USING (author_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Birthday wishes
CREATE POLICY "Voir les voeux" ON birthday_wishes FOR SELECT USING (true);
CREATE POLICY "Envoyer des voeux" ON birthday_wishes FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- ==========================================
-- 7. FONCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION get_news_views_count(news_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM news_views WHERE news_id = news_uuid;
$$ LANGUAGE sql STABLE;
