-- ============================================================
-- Migration: Fix all Supabase Linter issues
-- Fixes: RLS disabled, function search_path, initplan perf,
--        permissive INSERT, unindexed FKs, unused indexes
-- ============================================================

-- ==========================================
-- 1. ENABLE RLS ON job_titles (SECURITY)
-- ==========================================

ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde lit les postes"
  ON job_titles FOR SELECT
  USING (true);

-- ==========================================
-- 2. FIX FUNCTION SEARCH PATHS (SECURITY)
-- ==========================================

-- update_updated_at: trigger function, no table references needed
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Recreate SQL functions with fully-qualified table names + search_path
CREATE OR REPLACE FUNCTION public.get_post_likes_count(post_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.feed_likes WHERE post_id = post_uuid;
$$ LANGUAGE sql STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_post_comments_count(post_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.feed_comments WHERE post_id = post_uuid;
$$ LANGUAGE sql STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_news_views_count(news_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.news_views WHERE news_id = news_uuid;
$$ LANGUAGE sql STABLE SET search_path = '';

-- Recreate helper functions with search_path AND initplan fix
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = (select auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_admin_or_rh()
RETURNS BOOLEAN AS $$
  SELECT public.get_my_role() IN ('admin', 'rh');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_admin_rh_or_qse()
RETURNS BOOLEAN AS $$
  SELECT public.get_my_role() IN ('admin', 'rh', 'responsable_qse');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Fix update_updated_at_column if it exists (dashboard-created variant)
DO $$ BEGIN
  EXECUTE 'CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER AS $fn$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $fn$ LANGUAGE plpgsql SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- ==========================================
-- 3. FIX activity_logs INSERT POLICY (SECURITY)
-- ==========================================

DROP POLICY IF EXISTS "Insertion via service role uniquement" ON activity_logs;
CREATE POLICY "Insertion via service role uniquement"
  ON activity_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ==========================================
-- 4. FIX AUTH RLS INITPLAN (PERFORMANCE)
--    Replace auth.uid() with (select auth.uid())
-- ==========================================

-- --- PROFILES ---
DROP POLICY IF EXISTS "Chacun modifie son profil" ON profiles;
CREATE POLICY "Chacun modifie son profil"
  ON profiles FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- --- EVENTS ---
DROP POLICY IF EXISTS "Auteur ou admin modifie les événements" ON events;
CREATE POLICY "Auteur ou admin modifie les événements"
  ON events FOR UPDATE
  USING (created_by = (select auth.uid()) OR get_my_role() = 'admin');

-- --- EVENT PARTICIPANTS ---
DROP POLICY IF EXISTS "Gérer sa participation" ON event_participants;
CREATE POLICY "Gérer sa participation"
  ON event_participants FOR ALL
  USING (user_id = (select auth.uid()));

-- --- TODOS ---
DROP POLICY IF EXISTS "Chacun gère ses todos" ON todos;
CREATE POLICY "Chacun gère ses todos"
  ON todos FOR ALL
  USING (user_id = (select auth.uid()));

-- --- DOCUMENTS ---
DROP POLICY IF EXISTS "Utilisateurs authentifiés uploadent" ON documents;
CREATE POLICY "Utilisateurs authentifiés uploadent"
  ON documents FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Admin/Auteur modifie/supprime" ON documents;
CREATE POLICY "Admin/Auteur modifie/supprime"
  ON documents FOR UPDATE
  USING (uploaded_by = (select auth.uid()) OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admin supprime les documents" ON documents;
CREATE POLICY "Admin supprime les documents"
  ON documents FOR DELETE
  USING (uploaded_by = (select auth.uid()) OR get_my_role() = 'admin');

-- --- TIMEBITS ---
DROP POLICY IF EXISTS "Chacun gère son pointage" ON timebits;
CREATE POLICY "Chacun gère son pointage"
  ON timebits FOR ALL
  USING (user_id = (select auth.uid()));

-- --- FEED POSTS ---
DROP POLICY IF EXISTS "Authentifiés publient" ON feed_posts;
CREATE POLICY "Authentifiés publient"
  ON feed_posts FOR INSERT
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Auteur ou admin modifie" ON feed_posts;
CREATE POLICY "Auteur ou admin modifie"
  ON feed_posts FOR UPDATE
  USING (author_id = (select auth.uid()) OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "Auteur ou admin supprime" ON feed_posts;
CREATE POLICY "Auteur ou admin supprime"
  ON feed_posts FOR DELETE
  USING (author_id = (select auth.uid()) OR get_my_role() = 'admin');

-- --- FEED LIKES ---
DROP POLICY IF EXISTS "Gérer ses likes" ON feed_likes;
CREATE POLICY "Gérer ses likes"
  ON feed_likes FOR ALL
  USING (user_id = (select auth.uid()));

-- --- FEED COMMENTS ---
DROP POLICY IF EXISTS "Authentifiés commentent" ON feed_comments;
CREATE POLICY "Authentifiés commentent"
  ON feed_comments FOR INSERT
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Auteur ou admin supprime commentaire" ON feed_comments;
CREATE POLICY "Auteur ou admin supprime commentaire"
  ON feed_comments FOR DELETE
  USING (author_id = (select auth.uid()) OR get_my_role() = 'admin');

-- --- GALLERY PHOTOS ---
DROP POLICY IF EXISTS "Authentifiés uploadent des photos" ON gallery_photos;
CREATE POLICY "Authentifiés uploadent des photos"
  ON gallery_photos FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- --- DANGER REPORTS ---
DROP POLICY IF EXISTS "Authentifiés signalent" ON danger_reports;
CREATE POLICY "Authentifiés signalent"
  ON danger_reports FOR INSERT
  WITH CHECK (reported_by = (select auth.uid()));

-- --- REX ---
DROP POLICY IF EXISTS "Authentifiés créent des REX" ON rex;
CREATE POLICY "Authentifiés créent des REX"
  ON rex FOR INSERT
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Auteur modifie ses REX" ON rex;
CREATE POLICY "Auteur modifie ses REX"
  ON rex FOR UPDATE
  USING (author_id = (select auth.uid()) OR get_my_role() = 'admin');

-- --- USER EXPERIENCES ---
DROP POLICY IF EXISTS "Gérer ses expériences" ON user_experiences;
CREATE POLICY "Gérer ses expériences"
  ON user_experiences FOR ALL
  USING (user_id = (select auth.uid()));

-- --- USER DIPLOMAS ---
DROP POLICY IF EXISTS "Gérer ses diplômes" ON user_diplomas;
CREATE POLICY "Gérer ses diplômes"
  ON user_diplomas FOR ALL
  USING (user_id = (select auth.uid()));

-- --- USER FORMATIONS ---
DROP POLICY IF EXISTS "Gérer ses formations perso" ON user_formations;
CREATE POLICY "Gérer ses formations perso"
  ON user_formations FOR ALL
  USING (user_id = (select auth.uid()));

-- --- BONNES PRATIQUES ---
DROP POLICY IF EXISTS "Authentifiés créent des bonnes pratiques" ON bonnes_pratiques;
CREATE POLICY "Authentifiés créent des bonnes pratiques"
  ON bonnes_pratiques FOR INSERT
  WITH CHECK (author_id = (select auth.uid()));

-- --- FORMATION REGISTRATIONS ---
DROP POLICY IF EXISTS "Voir ses inscriptions" ON formation_registrations;
CREATE POLICY "Voir ses inscriptions"
  ON formation_registrations FOR SELECT
  USING (user_id = (select auth.uid()) OR is_admin_or_rh());

DROP POLICY IF EXISTS "S'inscrire" ON formation_registrations;
CREATE POLICY "S'inscrire"
  ON formation_registrations FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- --- CONGES ---
DROP POLICY IF EXISTS "Voir ses congés" ON conges;
CREATE POLICY "Voir ses congés"
  ON conges FOR SELECT
  USING (user_id = (select auth.uid()) OR is_admin_or_rh());

DROP POLICY IF EXISTS "Demander un congé" ON conges;
CREATE POLICY "Demander un congé"
  ON conges FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Modifier sa demande en attente" ON conges;
CREATE POLICY "Modifier sa demande en attente"
  ON conges FOR UPDATE
  USING ((user_id = (select auth.uid()) AND status = 'en_attente') OR is_admin_or_rh());

-- --- NOTIFICATIONS ---
DROP POLICY IF EXISTS "Voir ses notifications" ON notifications;
CREATE POLICY "Voir ses notifications"
  ON notifications FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Gérer ses notifications" ON notifications;
CREATE POLICY "Gérer ses notifications"
  ON notifications FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin crée des notifications" ON notifications;
CREATE POLICY "Admin crée des notifications"
  ON notifications FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Supprimer ses notifications" ON notifications;
CREATE POLICY "Supprimer ses notifications"
  ON notifications FOR DELETE
  USING (user_id = (select auth.uid()));

-- --- NEWS VIEWS ---
DROP POLICY IF EXISTS "Enregistrer une vue" ON news_views;
CREATE POLICY "Enregistrer une vue"
  ON news_views FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- --- NEWS COMMENTS ---
DROP POLICY IF EXISTS "Commenter une news" ON news_comments;
CREATE POLICY "Commenter une news"
  ON news_comments FOR INSERT
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Supprimer son commentaire news" ON news_comments;
CREATE POLICY "Supprimer son commentaire news"
  ON news_comments FOR DELETE
  USING (
    author_id = (select auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin'
  );

-- --- BIRTHDAY WISHES ---
DROP POLICY IF EXISTS "Envoyer des voeux" ON birthday_wishes;
CREATE POLICY "Envoyer des voeux"
  ON birthday_wishes FOR INSERT
  WITH CHECK (from_user_id = (select auth.uid()));

-- --- INTERNAL MESSAGES ---
DROP POLICY IF EXISTS "Users can view own messages" ON internal_messages;
CREATE POLICY "Users can view own messages"
  ON internal_messages FOR SELECT
  USING ((select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can send messages" ON internal_messages;
CREATE POLICY "Users can send messages"
  ON internal_messages FOR INSERT
  WITH CHECK ((select auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Users can update received messages" ON internal_messages;
CREATE POLICY "Users can update received messages"
  ON internal_messages FOR UPDATE
  USING ((select auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON internal_messages;
CREATE POLICY "Users can delete own messages"
  ON internal_messages FOR DELETE
  USING ((select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id);

-- --- AI CREDITS ---
DROP POLICY IF EXISTS "Voir ses crédits" ON ai_credits;
CREATE POLICY "Voir ses crédits"
  ON ai_credits FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Système gère les crédits" ON ai_credits;
CREATE POLICY "Système gère les crédits"
  ON ai_credits FOR ALL
  USING ((select auth.uid()) IS NOT NULL);

-- --- APP SETTINGS ---
DROP POLICY IF EXISTS "Admins can read settings" ON app_settings;
CREATE POLICY "Admins can read settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'rh')
    )
  );

-- --- ACTIVITY LOGS (SELECT) ---
DROP POLICY IF EXISTS "Admin et RH peuvent lire les logs" ON activity_logs;
CREATE POLICY "Admin et RH peuvent lire les logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role IN ('admin', 'rh')
    )
  );

-- --- SIGNALEMENT CATEGORIES ---
DROP POLICY IF EXISTS "QSE/Admin peuvent gérer les catégories" ON signalement_categories;
CREATE POLICY "QSE/Admin peuvent gérer les catégories"
  ON signalement_categories FOR ALL
  USING (is_admin_rh_or_qse());

-- --- ACTION PLANS ---
DROP POLICY IF EXISTS "QSE/Admin peuvent gérer les plans" ON action_plans;
CREATE POLICY "QSE/Admin peuvent gérer les plans"
  ON action_plans FOR ALL
  USING (is_admin_rh_or_qse());

-- --- ACTION PLAN TASKS ---
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent gérer les tâches" ON action_plan_tasks;
CREATE POLICY "Utilisateurs authentifiés peuvent gérer les tâches"
  ON action_plan_tasks FOR ALL
  USING ((select auth.uid()) IS NOT NULL);

-- --- SSE DASHBOARDS ---
-- Drop all possible policy names (original migration + possible dashboard renames)
DROP POLICY IF EXISTS "sse_dashboards_select" ON sse_dashboards;
DROP POLICY IF EXISTS "sse_dashboards_insert" ON sse_dashboards;
DROP POLICY IF EXISTS "sse_dashboards_update" ON sse_dashboards;
DROP POLICY IF EXISTS "sse_dashboards_delete" ON sse_dashboards;
DROP POLICY IF EXISTS "Admin/QSE can manage" ON sse_dashboards;
DROP POLICY IF EXISTS "Authenticated can read" ON sse_dashboards;

CREATE POLICY "Authenticated can read"
  ON sse_dashboards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/QSE can manage"
  ON sse_dashboards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'responsable_qse')
    )
  );

CREATE POLICY "Admin/QSE can update"
  ON sse_dashboards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'responsable_qse')
    )
  );

CREATE POLICY "Admin/QSE can delete"
  ON sse_dashboards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'responsable_qse')
    )
  );

-- ==========================================
-- 5. ADD MISSING FOREIGN KEY INDEXES (PERFORMANCE)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_app_settings_updated_by ON app_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_bonnes_pratiques_author_id ON bonnes_pratiques(author_id);
CREATE INDEX IF NOT EXISTS idx_conges_approved_by ON conges(approved_by);
CREATE INDEX IF NOT EXISTS idx_danger_reports_assigned_to ON danger_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_feed_comments_author_id ON feed_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_id ON feed_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author_id ON feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_formation_registrations_user_id ON formation_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_uploaded_by ON gallery_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_author_id ON news_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_news_views_user_id ON news_views(user_id);
CREATE INDEX IF NOT EXISTS idx_qse_content_updated_by ON qse_content(updated_by);
CREATE INDEX IF NOT EXISTS idx_rex_author_id ON rex(author_id);
CREATE INDEX IF NOT EXISTS idx_sse_dashboards_created_by ON sse_dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id);

-- ==========================================
-- 6. REMOVE UNUSED INDEXES (PERFORMANCE)
-- ==========================================

DROP INDEX IF EXISTS idx_action_plan_tasks_plan_id;
DROP INDEX IF EXISTS idx_signalement_categories_active;
DROP INDEX IF EXISTS idx_action_plans_status;
DROP INDEX IF EXISTS idx_internal_messages_conversation;
DROP INDEX IF EXISTS idx_bonnes_pratiques_pillar;
DROP INDEX IF EXISTS idx_danger_reports_status;
DROP INDEX IF EXISTS idx_danger_reports_category_id;
DROP INDEX IF EXISTS idx_danger_reports_action_plan_id;
DROP INDEX IF EXISTS idx_news_carousel;
DROP INDEX IF EXISTS idx_activity_logs_created_at;
DROP INDEX IF EXISTS idx_activity_logs_action;
DROP INDEX IF EXISTS idx_profiles_manager_id;
