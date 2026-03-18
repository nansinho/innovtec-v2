import { createClient } from "@/lib/supabase/server";

// ==========================================
// Permission keys
// ==========================================

export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_NEWS: "manage_news",
  MANAGE_QSE: "manage_qse",
  MANAGE_FORMATIONS: "manage_formations",
  MANAGE_EVENTS: "manage_events",
  MANAGE_DOCUMENTS: "manage_documents",
  MANAGE_TEAMS: "manage_teams",
  MANAGE_SETTINGS: "manage_settings",
  VIEW_LOGS: "view_logs",
  MANAGE_CONGES: "manage_conges",
  VIEW_ADMIN: "view_admin",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  manage_users: "Gérer les utilisateurs",
  manage_news: "Gérer les actualités",
  manage_qse: "Gérer QSE (signalements, plans, REX)",
  manage_formations: "Gérer les formations",
  manage_events: "Gérer les événements",
  manage_documents: "Gérer les documents",
  manage_teams: "Gérer équipes & départements",
  manage_settings: "Paramètres de l'application",
  view_logs: "Consulter le journal d'activité",
  manage_conges: "Gérer les congés",
  view_admin: "Accéder à l'administration",
};

// ==========================================
// Permission checking
// ==========================================

/**
 * Check if a user has a specific permission.
 * Admin role always has all permissions (bypass).
 * For other users, permissions are resolved via their job_title.
 */
export async function hasPermission(
  userRole: string,
  jobTitle: string,
  permission: PermissionKey
): Promise<boolean> {
  // Admin always has all permissions
  if (userRole === "admin") return true;

  if (!jobTitle) return false;

  const supabase = await createClient();

  const { data } = await supabase
    .from("job_title_permissions")
    .select("permission, job_title_id!inner(id)")
    .eq("job_title_id.label", jobTitle)
    .eq("permission", permission)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Get all permission keys for a user.
 * Admin gets all permissions. Others get permissions from their job_title.
 */
export async function getUserPermissions(
  userRole: string,
  jobTitle: string
): Promise<PermissionKey[]> {
  if (userRole === "admin") return [...ALL_PERMISSIONS];

  if (!jobTitle) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("job_title_permissions")
    .select("permission, job_title_id!inner(id, label)")
    .eq("job_title_id.label", jobTitle);

  if (!data) return [];
  return data.map((row) => row.permission as PermissionKey);
}

/**
 * Check permission using the caller profile (convenience wrapper for server actions).
 * Returns true if allowed, false if denied.
 */
export async function checkCallerPermission(
  permission: PermissionKey
): Promise<{ allowed: boolean; callerId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, job_title")
    .eq("id", user.id)
    .single();

  if (!profile) return { allowed: false };

  const allowed = await hasPermission(
    profile.role,
    profile.job_title || "",
    permission
  );

  return { allowed, callerId: profile.id };
}
