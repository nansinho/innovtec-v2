-- ============================================================
-- Migration: Fix Multiple Permissive Policies (Linter 0006)
--
-- Problem: FOR ALL policies overlap with specific SELECT policies,
-- creating multiple permissive policies for the same role+action.
--
-- Fix: Replace FOR ALL with specific INSERT/UPDATE/DELETE policies,
-- keeping a single SELECT policy per table.
-- ============================================================

-- ==========================================
-- 1. action_plan_tasks
--    Conflict: "Utilisateurs authentifiés peuvent gérer les tâches" (ALL)
--           + "Utilisateurs authentifiés peuvent lire les tâches" (SELECT)
--    Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent gérer les tâches" ON action_plan_tasks;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire les tâches" ON action_plan_tasks;

CREATE POLICY "Lire les tâches"
  ON action_plan_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gérer les tâches"
  ON action_plan_tasks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Modifier les tâches"
  ON action_plan_tasks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Supprimer les tâches"
  ON action_plan_tasks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ==========================================
-- 2. action_plans
--    Conflict: "QSE/Admin peuvent gérer les plans" (ALL)
--           + "Utilisateurs authentifiés peuvent lire les plans" (SELECT)
--    Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE for QSE/Admin
-- ==========================================

DROP POLICY IF EXISTS "QSE/Admin peuvent gérer les plans" ON action_plans;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent lire les plans" ON action_plans;

CREATE POLICY "Lire les plans"
  ON action_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Créer les plans"
  ON action_plans FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_rh_or_qse());

CREATE POLICY "Modifier les plans"
  ON action_plans FOR UPDATE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

CREATE POLICY "Supprimer les plans"
  ON action_plans FOR DELETE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

-- ==========================================
-- 3. ai_credits
--    Conflict: "Voir ses crédits" (SELECT) + "Système gère les crédits" (ALL)
--           + "Admin voit tous les crédits" (SELECT)
--    Fix: Drop FOR ALL + extra SELECTs, create single SELECT + specific write ops
-- ==========================================

DROP POLICY IF EXISTS "Voir ses crédits" ON ai_credits;
DROP POLICY IF EXISTS "Système gère les crédits" ON ai_credits;
DROP POLICY IF EXISTS "Admin voit tous les crédits" ON ai_credits;

CREATE POLICY "Voir ses crédits ou admin"
  ON ai_credits FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_admin_or_rh()
  );

CREATE POLICY "Insérer des crédits"
  ON ai_credits FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Modifier des crédits"
  ON ai_credits FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Supprimer des crédits"
  ON ai_credits FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ==========================================
-- 4. bonnes_pratiques
--    Conflict: "QSE/Admin gèrent les bonnes pratiques" (ALL)
--           + "Authentifiés créent des bonnes pratiques" (INSERT)
--           + "Tout le monde lit les bonnes pratiques" (SELECT)
--    Fix: Drop all, create one per action
-- ==========================================

DROP POLICY IF EXISTS "QSE/Admin gèrent les bonnes pratiques" ON bonnes_pratiques;
DROP POLICY IF EXISTS "Authentifiés créent des bonnes pratiques" ON bonnes_pratiques;
DROP POLICY IF EXISTS "Tout le monde lit les bonnes pratiques" ON bonnes_pratiques;

CREATE POLICY "Lire les bonnes pratiques"
  ON bonnes_pratiques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Créer une bonne pratique"
  ON bonnes_pratiques FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Modifier une bonne pratique"
  ON bonnes_pratiques FOR UPDATE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

CREATE POLICY "Supprimer une bonne pratique"
  ON bonnes_pratiques FOR DELETE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

-- ==========================================
-- 5. event_participants
--    Conflict: "Gérer sa participation" (ALL) + "Admin gère les participants" (ALL)
--           + "Voir les participants" (SELECT)
--    Fix: Drop all, create one per action
-- ==========================================

DROP POLICY IF EXISTS "Gérer sa participation" ON event_participants;
DROP POLICY IF EXISTS "Admin gère les participants" ON event_participants;
DROP POLICY IF EXISTS "Voir les participants" ON event_participants;

CREATE POLICY "Voir les participants"
  ON event_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "S'inscrire à un événement"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR public.is_admin_or_rh()
  );

CREATE POLICY "Modifier sa participation"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_admin_or_rh()
  );

CREATE POLICY "Se désinscrire"
  ON event_participants FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_admin_or_rh()
  );

-- ==========================================
-- 6. feed_likes
--    Conflict: "Gérer ses likes" (ALL) + "Voir les likes" (SELECT)
--    Fix: Drop FOR ALL, keep SELECT, add INSERT/DELETE
-- ==========================================

DROP POLICY IF EXISTS "Gérer ses likes" ON feed_likes;
DROP POLICY IF EXISTS "Voir les likes" ON feed_likes;

CREATE POLICY "Voir les likes"
  ON feed_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ajouter un like"
  ON feed_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Retirer son like"
  ON feed_likes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ==========================================
-- 7. formation_registrations
--    Conflict: "Admin/RH gèrent les inscriptions" (ALL)
--           + "Voir ses inscriptions" (SELECT) + "S'inscrire" (INSERT)
--    Fix: Drop FOR ALL, keep SELECT + INSERT, add UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "Admin/RH gèrent les inscriptions" ON formation_registrations;
DROP POLICY IF EXISTS "Voir ses inscriptions" ON formation_registrations;
DROP POLICY IF EXISTS "S'inscrire" ON formation_registrations;

CREATE POLICY "Voir ses inscriptions"
  ON formation_registrations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "S'inscrire"
  ON formation_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Modifier une inscription"
  ON formation_registrations FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_rh());

CREATE POLICY "Supprimer une inscription"
  ON formation_registrations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

-- ==========================================
-- 8. formations
--    Conflict: "Admin/RH gèrent les formations" (ALL)
--           + "Tout le monde voit les formations" (SELECT)
--    Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "Admin/RH gèrent les formations" ON formations;
DROP POLICY IF EXISTS "Tout le monde voit les formations" ON formations;

CREATE POLICY "Voir les formations"
  ON formations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Créer une formation"
  ON formations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_rh());

CREATE POLICY "Modifier une formation"
  ON formations FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_rh());

CREATE POLICY "Supprimer une formation"
  ON formations FOR DELETE
  TO authenticated
  USING (public.is_admin_or_rh());

-- ==========================================
-- 9. news
--    Conflict: "Admin crée/modifie les news" (ALL)
--           + "Tout le monde lit les news publiées" (SELECT)
--    Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "Admin crée/modifie les news" ON news;
DROP POLICY IF EXISTS "Tout le monde lit les news publiées" ON news;

CREATE POLICY "Lire les news publiées"
  ON news FOR SELECT
  TO authenticated
  USING (is_published = true OR public.is_admin_or_rh());

CREATE POLICY "Créer une news"
  ON news FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_rh());

CREATE POLICY "Modifier une news"
  ON news FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_rh());

CREATE POLICY "Supprimer une news"
  ON news FOR DELETE
  TO authenticated
  USING (public.is_admin_or_rh());

-- ==========================================
-- 10. profiles
--     Conflict: "Admin/RH gèrent tous les profils" (ALL)
--            + "Tout le monde voit les profils actifs" (SELECT)
--            + "Chacun modifie son profil" (UPDATE)
--     Fix: Drop FOR ALL, consolidate SELECT + UPDATE, add INSERT
-- ==========================================

DROP POLICY IF EXISTS "Admin/RH gèrent tous les profils" ON profiles;
DROP POLICY IF EXISTS "Tout le monde voit les profils actifs" ON profiles;
DROP POLICY IF EXISTS "Chacun modifie son profil" ON profiles;

CREATE POLICY "Voir les profils"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Modifier son profil ou admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR public.is_admin_or_rh()
  )
  WITH CHECK (
    id = (select auth.uid())
    OR public.is_admin_or_rh()
  );

CREATE POLICY "Admin insère un profil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (select auth.uid())
    OR public.is_admin_or_rh()
  );

-- ==========================================
-- 11. qse_content
--     Conflict: "QSE/Admin gèrent le contenu" (ALL)
--            + "Tout le monde lit le contenu QSE" (SELECT)
--     Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "QSE/Admin gèrent le contenu" ON qse_content;
DROP POLICY IF EXISTS "Tout le monde lit le contenu QSE" ON qse_content;

CREATE POLICY "Lire le contenu QSE"
  ON qse_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Créer du contenu QSE"
  ON qse_content FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_rh_or_qse());

CREATE POLICY "Modifier le contenu QSE"
  ON qse_content FOR UPDATE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

CREATE POLICY "Supprimer le contenu QSE"
  ON qse_content FOR DELETE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

-- ==========================================
-- 12. signalement_categories
--     Conflict: "QSE/Admin peuvent gérer les catégories" (ALL)
--            + "Tout le monde peut lire les catégories" (SELECT)
--     Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "QSE/Admin peuvent gérer les catégories" ON signalement_categories;
DROP POLICY IF EXISTS "Tout le monde peut lire les catégories" ON signalement_categories;

CREATE POLICY "Lire les catégories"
  ON signalement_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Créer une catégorie"
  ON signalement_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_rh_or_qse());

CREATE POLICY "Modifier une catégorie"
  ON signalement_categories FOR UPDATE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

CREATE POLICY "Supprimer une catégorie"
  ON signalement_categories FOR DELETE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

-- ==========================================
-- 13. sse_indicators
--     Conflict: "QSE/Admin gèrent les indicateurs" (ALL)
--            + "Tout le monde voit les indicateurs SSE" (SELECT)
--     Fix: Drop FOR ALL, keep SELECT, add INSERT/UPDATE/DELETE
-- ==========================================

DROP POLICY IF EXISTS "QSE/Admin gèrent les indicateurs" ON sse_indicators;
DROP POLICY IF EXISTS "Tout le monde voit les indicateurs SSE" ON sse_indicators;

CREATE POLICY "Voir les indicateurs SSE"
  ON sse_indicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Créer un indicateur SSE"
  ON sse_indicators FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_rh_or_qse());

CREATE POLICY "Modifier un indicateur SSE"
  ON sse_indicators FOR UPDATE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

CREATE POLICY "Supprimer un indicateur SSE"
  ON sse_indicators FOR DELETE
  TO authenticated
  USING (public.is_admin_rh_or_qse());

-- ==========================================
-- 14. timebits
--     Conflict: "Chacun gère son pointage" (ALL)
--            + "Admin/RH voient tous les pointages" (SELECT)
--     Fix: Drop FOR ALL + extra SELECT, create one per action
-- ==========================================

DROP POLICY IF EXISTS "Chacun gère son pointage" ON timebits;
DROP POLICY IF EXISTS "Admin/RH voient tous les pointages" ON timebits;

CREATE POLICY "Voir ses pointages ou admin"
  ON timebits FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Créer son pointage"
  ON timebits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Modifier son pointage"
  ON timebits FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Supprimer son pointage"
  ON timebits FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ==========================================
-- 15. user_diplomas
--     Conflict: "Gérer ses diplômes" (ALL) + "Admin/RH gèrent les diplômes" (ALL)
--            + "Voir les diplômes des profils actifs" (SELECT)
--     Fix: Drop all, create one per action
-- ==========================================

DROP POLICY IF EXISTS "Gérer ses diplômes" ON user_diplomas;
DROP POLICY IF EXISTS "Admin/RH gèrent les diplômes" ON user_diplomas;
DROP POLICY IF EXISTS "Voir les diplômes des profils actifs" ON user_diplomas;

CREATE POLICY "Voir les diplômes"
  ON user_diplomas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ajouter ses diplômes"
  ON user_diplomas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Modifier ses diplômes"
  ON user_diplomas FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Supprimer ses diplômes"
  ON user_diplomas FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

-- ==========================================
-- 16. user_experiences
--     Conflict: "Gérer ses expériences" (ALL) + "Admin/RH gèrent les expériences" (ALL)
--            + "Voir les expériences des profils actifs" (SELECT)
--     Fix: Drop all, create one per action
-- ==========================================

DROP POLICY IF EXISTS "Gérer ses expériences" ON user_experiences;
DROP POLICY IF EXISTS "Admin/RH gèrent les expériences" ON user_experiences;
DROP POLICY IF EXISTS "Voir les expériences des profils actifs" ON user_experiences;

CREATE POLICY "Voir les expériences"
  ON user_experiences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ajouter ses expériences"
  ON user_experiences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Modifier ses expériences"
  ON user_experiences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Supprimer ses expériences"
  ON user_experiences FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

-- ==========================================
-- 17. user_formations
--     Conflict: "Gérer ses formations perso" (ALL) + "Admin/RH gèrent les formations perso" (ALL)
--            + "Voir les formations perso des profils actifs" (SELECT)
--     Fix: Drop all, create one per action
-- ==========================================

DROP POLICY IF EXISTS "Gérer ses formations perso" ON user_formations;
DROP POLICY IF EXISTS "Admin/RH gèrent les formations perso" ON user_formations;
DROP POLICY IF EXISTS "Voir les formations perso des profils actifs" ON user_formations;

CREATE POLICY "Voir les formations perso"
  ON user_formations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ajouter ses formations perso"
  ON user_formations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Modifier ses formations perso"
  ON user_formations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());

CREATE POLICY "Supprimer ses formations perso"
  ON user_formations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin_or_rh());
