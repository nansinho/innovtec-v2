-- ==========================================
-- INNOVTEC Réseaux — RLS Policies (COMPLET)
-- ==========================================
-- Script idempotent : peut être exécuté plusieurs fois sans erreur.
-- À exécuter dans l'éditeur SQL de Supabase pour sécuriser TOUTES les tables.
--
-- Corrige le lint Supabase : rls_disabled_in_public
-- Tables concernées : profiles, news, events, event_participants, todos,
-- documents, timebits, feed_posts, feed_likes, feed_comments, gallery_photos,
-- danger_reports, rex, sse_indicators, formations, formation_registrations, conges
-- ==========================================

-- ==========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==========================================

-- Tables principales
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

-- Tables profil enrichi
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_diplomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_formations ENABLE ROW LEVEL SECURITY;

-- Tables notifications / blog / anniversaires
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_wishes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. HELPER FUNCTIONS
-- ==========================================

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

-- ==========================================
-- 3. DROP EXISTING POLICIES (idempotent)
-- ==========================================

-- PROFILES
DROP POLICY IF EXISTS "Tout le monde voit les profils actifs" ON profiles;
DROP POLICY IF EXISTS "Chacun modifie son profil" ON profiles;
DROP POLICY IF EXISTS "Admin/RH gèrent tous les profils" ON profiles;

-- NEWS
DROP POLICY IF EXISTS "Tout le monde lit les news publiées" ON news;
DROP POLICY IF EXISTS "Admin crée/modifie les news" ON news;

-- EVENTS
DROP POLICY IF EXISTS "Tout le monde voit les événements" ON events;
DROP POLICY IF EXISTS "Admin/Chef créent des événements" ON events;
DROP POLICY IF EXISTS "Auteur ou admin modifie les événements" ON events;
DROP POLICY IF EXISTS "Admin supprime les événements" ON events;

-- EVENT PARTICIPANTS
DROP POLICY IF EXISTS "Voir les participants" ON event_participants;
DROP POLICY IF EXISTS "Gérer sa participation" ON event_participants;
DROP POLICY IF EXISTS "Admin gère les participants" ON event_participants;

-- TODOS
DROP POLICY IF EXISTS "Chacun gère ses todos" ON todos;

-- DOCUMENTS
DROP POLICY IF EXISTS "Tout le monde lit les documents" ON documents;
DROP POLICY IF EXISTS "Utilisateurs authentifiés uploadent" ON documents;
DROP POLICY IF EXISTS "Admin/Auteur modifie/supprime" ON documents;
DROP POLICY IF EXISTS "Admin supprime les documents" ON documents;

-- TIMEBITS
DROP POLICY IF EXISTS "Chacun gère son pointage" ON timebits;
DROP POLICY IF EXISTS "Admin/RH voient tous les pointages" ON timebits;

-- FEED
DROP POLICY IF EXISTS "Tout le monde lit le feed" ON feed_posts;
DROP POLICY IF EXISTS "Authentifiés publient" ON feed_posts;
DROP POLICY IF EXISTS "Auteur ou admin modifie" ON feed_posts;
DROP POLICY IF EXISTS "Auteur ou admin supprime" ON feed_posts;

-- FEED LIKES
DROP POLICY IF EXISTS "Voir les likes" ON feed_likes;
DROP POLICY IF EXISTS "Gérer ses likes" ON feed_likes;

-- FEED COMMENTS
DROP POLICY IF EXISTS "Voir les commentaires" ON feed_comments;
DROP POLICY IF EXISTS "Authentifiés commentent" ON feed_comments;
DROP POLICY IF EXISTS "Auteur ou admin supprime commentaire" ON feed_comments;

-- GALLERY
DROP POLICY IF EXISTS "Tout le monde voit la galerie" ON gallery_photos;
DROP POLICY IF EXISTS "Authentifiés uploadent des photos" ON gallery_photos;
DROP POLICY IF EXISTS "Admin supprime les photos" ON gallery_photos;

-- DANGER REPORTS
DROP POLICY IF EXISTS "Tout le monde voit les signalements" ON danger_reports;
DROP POLICY IF EXISTS "Authentifiés signalent" ON danger_reports;
DROP POLICY IF EXISTS "QSE/Admin gèrent les signalements" ON danger_reports;
DROP POLICY IF EXISTS "Admin supprime les signalements" ON danger_reports;

-- REX
DROP POLICY IF EXISTS "Tout le monde lit les REX" ON rex;
DROP POLICY IF EXISTS "Authentifiés créent des REX" ON rex;

-- SSE INDICATORS
DROP POLICY IF EXISTS "Tout le monde voit les indicateurs SSE" ON sse_indicators;
DROP POLICY IF EXISTS "QSE/Admin gèrent les indicateurs" ON sse_indicators;

-- USER EXPERIENCES
DROP POLICY IF EXISTS "Voir les expériences des profils actifs" ON user_experiences;
DROP POLICY IF EXISTS "Gérer ses expériences" ON user_experiences;
DROP POLICY IF EXISTS "Admin/RH gèrent les expériences" ON user_experiences;

-- USER DIPLOMAS
DROP POLICY IF EXISTS "Voir les diplômes des profils actifs" ON user_diplomas;
DROP POLICY IF EXISTS "Gérer ses diplômes" ON user_diplomas;
DROP POLICY IF EXISTS "Admin/RH gèrent les diplômes" ON user_diplomas;

-- USER FORMATIONS
DROP POLICY IF EXISTS "Voir les formations perso des profils actifs" ON user_formations;
DROP POLICY IF EXISTS "Gérer ses formations perso" ON user_formations;
DROP POLICY IF EXISTS "Admin/RH gèrent les formations perso" ON user_formations;

-- FORMATIONS
DROP POLICY IF EXISTS "Tout le monde voit les formations" ON formations;
DROP POLICY IF EXISTS "Admin/RH gèrent les formations" ON formations;

-- FORMATION REGISTRATIONS
DROP POLICY IF EXISTS "Voir ses inscriptions" ON formation_registrations;
DROP POLICY IF EXISTS "S'inscrire" ON formation_registrations;
DROP POLICY IF EXISTS "Admin/RH gèrent les inscriptions" ON formation_registrations;

-- CONGES
DROP POLICY IF EXISTS "Voir ses congés" ON conges;
DROP POLICY IF EXISTS "Demander un congé" ON conges;
DROP POLICY IF EXISTS "Modifier sa demande en attente" ON conges;
DROP POLICY IF EXISTS "Admin/RH suppriment" ON conges;

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Voir ses notifications" ON notifications;
DROP POLICY IF EXISTS "Gérer ses notifications" ON notifications;
DROP POLICY IF EXISTS "Admin crée des notifications" ON notifications;
DROP POLICY IF EXISTS "Supprimer ses notifications" ON notifications;

-- NEWS VIEWS
DROP POLICY IF EXISTS "Voir les vues" ON news_views;
DROP POLICY IF EXISTS "Enregistrer une vue" ON news_views;

-- NEWS COMMENTS
DROP POLICY IF EXISTS "Voir les commentaires news" ON news_comments;
DROP POLICY IF EXISTS "Commenter une news" ON news_comments;
DROP POLICY IF EXISTS "Supprimer son commentaire news" ON news_comments;

-- BIRTHDAY WISHES
DROP POLICY IF EXISTS "Voir les voeux" ON birthday_wishes;
DROP POLICY IF EXISTS "Envoyer des voeux" ON birthday_wishes;

-- STORAGE
DROP POLICY IF EXISTS "Avatars publics" ON storage.objects;
DROP POLICY IF EXISTS "Upload son avatar" ON storage.objects;
DROP POLICY IF EXISTS "News images publiques" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Gallery publique" ON storage.objects;
DROP POLICY IF EXISTS "Upload gallery" ON storage.objects;
DROP POLICY IF EXISTS "Documents auth" ON storage.objects;
DROP POLICY IF EXISTS "Upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Feed images publiques" ON storage.objects;
DROP POLICY IF EXISTS "Upload feed images" ON storage.objects;
DROP POLICY IF EXISTS "Danger photos auth" ON storage.objects;
DROP POLICY IF EXISTS "Upload danger photos" ON storage.objects;

-- ==========================================
-- 4. CREATE POLICIES
-- ==========================================

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

-- FEED POSTS
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

-- USER EXPERIENCES
CREATE POLICY "Voir les expériences des profils actifs" ON user_experiences FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_active = true));
CREATE POLICY "Gérer ses expériences" ON user_experiences FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les expériences" ON user_experiences FOR ALL USING (is_admin_or_rh());

-- USER DIPLOMAS
CREATE POLICY "Voir les diplômes des profils actifs" ON user_diplomas FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_active = true));
CREATE POLICY "Gérer ses diplômes" ON user_diplomas FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les diplômes" ON user_diplomas FOR ALL USING (is_admin_or_rh());

-- USER FORMATIONS (personal/external)
CREATE POLICY "Voir les formations perso des profils actifs" ON user_formations FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_active = true));
CREATE POLICY "Gérer ses formations perso" ON user_formations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin/RH gèrent les formations perso" ON user_formations FOR ALL USING (is_admin_or_rh());

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

-- NOTIFICATIONS
CREATE POLICY "Voir ses notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Gérer ses notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin crée des notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Supprimer ses notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- NEWS VIEWS
CREATE POLICY "Voir les vues" ON news_views FOR SELECT USING (true);
CREATE POLICY "Enregistrer une vue" ON news_views FOR INSERT WITH CHECK (user_id = auth.uid());

-- NEWS COMMENTS
CREATE POLICY "Voir les commentaires news" ON news_comments FOR SELECT USING (true);
CREATE POLICY "Commenter une news" ON news_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Supprimer son commentaire news" ON news_comments FOR DELETE USING (author_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- BIRTHDAY WISHES
CREATE POLICY "Voir les voeux" ON birthday_wishes FOR SELECT USING (true);
CREATE POLICY "Envoyer des voeux" ON birthday_wishes FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- ==========================================
-- 5. STORAGE POLICIES
-- ==========================================

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
