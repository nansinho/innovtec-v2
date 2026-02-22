-- ============================================================
-- INNOVTEC Réseaux — Intranet Supabase Schema
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- ==========================================
-- 1. TYPES ENUM
-- ==========================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'rh',
  'responsable_qse',
  'chef_chantier',
  'technicien'
);

CREATE TYPE news_category AS ENUM (
  'entreprise',
  'securite',
  'formation',
  'chantier',
  'social',
  'rh'
);

CREATE TYPE news_priority AS ENUM (
  'normal',
  'important',
  'urgent'
);

CREATE TYPE event_color AS ENUM (
  'yellow',
  'blue',
  'purple',
  'green',
  'red'
);

CREATE TYPE todo_status AS ENUM (
  'pending',
  'done'
);

CREATE TYPE timebit_mode AS ENUM (
  'chantier',
  'bureau'
);

CREATE TYPE danger_status AS ENUM (
  'signale',
  'en_cours',
  'resolu',
  'cloture'
);

CREATE TYPE conge_status AS ENUM (
  'en_attente',
  'approuve',
  'refuse'
);

CREATE TYPE conge_type AS ENUM (
  'conge_paye',
  'rtt',
  'maladie',
  'sans_solde',
  'exceptionnel'
);

-- ==========================================
-- 2. TABLES PRINCIPALES
-- ==========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'technicien',
  job_title TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category news_category NOT NULL DEFAULT 'entreprise',
  priority news_priority NOT NULL DEFAULT 'normal',
  image_url TEXT DEFAULT '',
  is_carousel BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  color event_color NOT NULL DEFAULT 'blue',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited',
  UNIQUE(event_id, user_id)
);

CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  status todo_status NOT NULL DEFAULT 'pending',
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  file_type TEXT DEFAULT 'pdf',
  category TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE timebits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode timebit_mode NOT NULL DEFAULT 'bureau',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  album TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. TABLES QSE
-- ==========================================

CREATE TABLE danger_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  status danger_status NOT NULL DEFAULT 'signale',
  severity INTEGER NOT NULL DEFAULT 1,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  lessons_learned TEXT DEFAULT '',
  chantier TEXT DEFAULT '',
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sse_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  accidents_with_leave INTEGER NOT NULL DEFAULT 0,
  accidents_without_leave INTEGER NOT NULL DEFAULT 0,
  near_misses INTEGER NOT NULL DEFAULT 0,
  danger_situations INTEGER NOT NULL DEFAULT 0,
  hours_worked INTEGER NOT NULL DEFAULT 0,
  frequency_rate DECIMAL(6,2) DEFAULT 0,
  severity_rate DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 4. TABLES RH
-- ==========================================

CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  organisme TEXT DEFAULT '',
  date_start DATE,
  date_end DATE,
  max_participants INTEGER DEFAULT 20,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE formation_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inscrit',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(formation_id, user_id)
);

CREATE TABLE conges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type conge_type NOT NULL DEFAULT 'conge_paye',
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  reason TEXT DEFAULT '',
  status conge_status NOT NULL DEFAULT 'en_attente',
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 5. INDEXES
-- ==========================================

CREATE INDEX idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX idx_news_carousel ON news(is_carousel, is_published);
CREATE INDEX idx_events_start ON events(start_at);
CREATE INDEX idx_todos_user ON todos(user_id, status);
CREATE INDEX idx_timebits_user ON timebits(user_id, started_at DESC);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX idx_danger_reports_status ON danger_reports(status);
CREATE INDEX idx_conges_user ON conges(user_id, date_start);
CREATE INDEX idx_documents_category ON documents(category, created_at DESC);

-- ==========================================
-- 6. FONCTIONS UTILITAIRES
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_news_updated BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_events_updated BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_todos_updated BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_feed_posts_updated BEFORE UPDATE ON feed_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_danger_reports_updated BEFORE UPDATE ON danger_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_conges_updated BEFORE UPDATE ON conges FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION get_post_likes_count(post_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM feed_likes WHERE post_id = post_uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_post_comments_count(post_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM feed_comments WHERE post_id = post_uuid;
$$ LANGUAGE sql STABLE;

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timebits ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE danger_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rex ENABLE ROW LEVEL SECURITY;
ALTER TABLE sse_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_rh()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('admin', 'rh');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_rh_or_qse()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('admin', 'rh', 'responsable_qse');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Tout le monde voit les profils actifs" ON profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Chacun modifie son profil" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admin/RH gèrent tous les profils" ON profiles FOR ALL USING (is_admin_or_rh());

-- NEWS
CREATE POLICY "Tout le monde lit les news publiées" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "Admin crée/modifie les news" ON news FOR ALL USING (get_my_role() IN ('admin', 'rh', 'responsable_qse'));

-- EVENTS
CREATE POLICY "Tout le monde voit les événements" ON events FOR SELECT USING (true);
CREATE POLICY "Admin/Chef créent des événements" ON events FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'rh', 'chef_chantier', 'responsable_qse'));
CREATE POLICY "Auteur ou admin modifie les événements" ON events FOR UPDATE USING (created_by = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Admin supprime les événements" ON events FOR DELETE USING (get_my_role() = 'admin');

-- EVENT PARTICIPANTS
CREATE POLICY "Voir les participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Gérer sa participation" ON event_participants FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin gère les participants" ON event_participants FOR ALL USING (get_my_role() = 'admin');

-- TODOS
CREATE POLICY "Chacun gère ses todos" ON todos FOR ALL USING (user_id = auth.uid());

-- DOCUMENTS
CREATE POLICY "Tout le monde lit les documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Utilisateurs authentifiés uploadent" ON documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Auteur modifie/supprime" ON documents FOR UPDATE USING (uploaded_by = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Admin supprime les documents" ON documents FOR DELETE USING (uploaded_by = auth.uid() OR get_my_role() = 'admin');

-- TIMEBITS
CREATE POLICY "Chacun gère son pointage" ON timebits FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH voient tous les pointages" ON timebits FOR SELECT USING (is_admin_or_rh());

-- FEED
CREATE POLICY "Tout le monde lit le feed" ON feed_posts FOR SELECT USING (true);
CREATE POLICY "Authentifiés publient" ON feed_posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Auteur ou admin modifie" ON feed_posts FOR UPDATE USING (author_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "Auteur ou admin supprime" ON feed_posts FOR DELETE USING (author_id = auth.uid() OR get_my_role() = 'admin');

-- FEED LIKES
CREATE POLICY "Voir les likes" ON feed_likes FOR SELECT USING (true);
CREATE POLICY "Gérer ses likes" ON feed_likes FOR ALL USING (user_id = auth.uid());

-- FEED COMMENTS
CREATE POLICY "Voir les commentaires" ON feed_comments FOR SELECT USING (true);
CREATE POLICY "Authentifiés commentent" ON feed_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Auteur ou admin supprime commentaire" ON feed_comments FOR DELETE USING (author_id = auth.uid() OR get_my_role() = 'admin');

-- GALLERY
CREATE POLICY "Tout le monde voit la galerie" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Authentifiés uploadent des photos" ON gallery_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin supprime les photos" ON gallery_photos FOR DELETE USING (get_my_role() = 'admin');

-- DANGER REPORTS
CREATE POLICY "Tout le monde voit les signalements" ON danger_reports FOR SELECT USING (true);
CREATE POLICY "Authentifiés signalent" ON danger_reports FOR INSERT WITH CHECK (reported_by = auth.uid());
CREATE POLICY "QSE/Admin gèrent les signalements" ON danger_reports FOR UPDATE USING (is_admin_rh_or_qse());
CREATE POLICY "Admin supprime les signalements" ON danger_reports FOR DELETE USING (get_my_role() = 'admin');

-- REX
CREATE POLICY "Tout le monde lit les REX" ON rex FOR SELECT USING (true);
CREATE POLICY "Authentifiés créent des REX" ON rex FOR INSERT WITH CHECK (author_id = auth.uid());

-- SSE INDICATORS
CREATE POLICY "Tout le monde voit les indicateurs SSE" ON sse_indicators FOR SELECT USING (true);
CREATE POLICY "QSE/Admin gèrent les indicateurs" ON sse_indicators FOR ALL USING (is_admin_rh_or_qse());

-- FORMATIONS
CREATE POLICY "Tout le monde voit les formations" ON formations FOR SELECT USING (true);
CREATE POLICY "Admin/RH gèrent les formations" ON formations FOR ALL USING (is_admin_or_rh());

-- FORMATION REGISTRATIONS
CREATE POLICY "Voir ses inscriptions" ON formation_registrations FOR SELECT USING (user_id = auth.uid() OR is_admin_or_rh());
CREATE POLICY "S'inscrire" ON formation_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les inscriptions" ON formation_registrations FOR ALL USING (is_admin_or_rh());

-- CONGES
CREATE POLICY "Voir ses congés" ON conges FOR SELECT USING (user_id = auth.uid() OR is_admin_or_rh());
CREATE POLICY "Demander un congé" ON conges FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Modifier sa demande en attente" ON conges FOR UPDATE USING ((user_id = auth.uid() AND status = 'en_attente') OR is_admin_or_rh());
CREATE POLICY "Admin/RH suppriment" ON conges FOR DELETE USING (is_admin_or_rh());

-- ==========================================
-- 8. STORAGE BUCKETS
-- ==========================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('documents', 'documents', false),
  ('news-images', 'news-images', true),
  ('gallery', 'gallery', true),
  ('danger-photos', 'danger-photos', false),
  ('feed-images', 'feed-images', true);

CREATE POLICY "Avatars publics" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Upload son avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "News images publiques" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Admin upload news images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-images' AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'rh', 'responsable_qse'));
CREATE POLICY "Gallery publique" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Upload gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "Documents auth" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Feed images publiques" ON storage.objects FOR SELECT USING (bucket_id = 'feed-images');
CREATE POLICY "Upload feed images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'feed-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Danger photos auth" ON storage.objects FOR SELECT USING (bucket_id = 'danger-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Upload danger photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'danger-photos' AND auth.uid() IS NOT NULL);
