-- ============================================
-- MIGRATION: Blog System - Likes, Shares, Attachments
-- ============================================

-- Likes sur les articles
CREATE TABLE IF NOT EXISTS news_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(news_id, user_id)
);

-- Partages d'articles
CREATE TABLE IF NOT EXISTS news_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pièces jointes
CREATE TABLE IF NOT EXISTS news_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter news_id optionnel aux feed_posts pour lier les partages
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS news_id UUID REFERENCES news(id) ON DELETE SET NULL;

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_news_likes_news ON news_likes(news_id);
CREATE INDEX IF NOT EXISTS idx_news_likes_user ON news_likes(news_id, user_id);
CREATE INDEX IF NOT EXISTS idx_news_shares_news ON news_shares(news_id);
CREATE INDEX IF NOT EXISTS idx_news_attachments_news ON news_attachments(news_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_news ON feed_posts(news_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('news-attachments', 'news-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_attachments ENABLE ROW LEVEL SECURITY;

-- news_likes: tous les utilisateurs auth peuvent voir et liker
CREATE POLICY "Anyone can view likes" ON news_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON news_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own likes" ON news_likes FOR DELETE USING (auth.uid() = user_id);

-- news_shares: tous les utilisateurs auth peuvent partager
CREATE POLICY "Anyone can view shares" ON news_shares FOR SELECT USING (true);
CREATE POLICY "Authenticated users can share" ON news_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- news_attachments: admin/rh/qse créent, tous lisent
CREATE POLICY "Anyone can view attachments" ON news_attachments FOR SELECT USING (true);
CREATE POLICY "Admin can manage attachments" ON news_attachments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh', 'responsable_qse'))
);
CREATE POLICY "Admin can delete attachments" ON news_attachments FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh', 'responsable_qse'))
);

-- Storage policies for news-attachments bucket
CREATE POLICY "Anyone can read attachments" ON storage.objects FOR SELECT USING (bucket_id = 'news-attachments');
CREATE POLICY "Admin can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'news-attachments' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh', 'responsable_qse'))
);
CREATE POLICY "Admin can delete attachment files" ON storage.objects FOR DELETE USING (
  bucket_id = 'news-attachments' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'rh', 'responsable_qse'))
);
