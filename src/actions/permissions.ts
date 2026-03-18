"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ALL_PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { auditLog } from "@/lib/audit-logger";

// ==========================================
// Types
// ==========================================

export interface JobTitlePermissions {
  job_title_id: string;
  job_title_label: string;
  permissions: string[];
}

// ==========================================
// Read operations
// ==========================================

/**
 * Get the full permissions matrix: all job titles with their assigned permissions.
 */
export async function getPermissionsMatrix(): Promise<JobTitlePermissions[]> {
  const supabase = await createClient();

  // Verify caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return [];

  const supabaseAdmin = createAdminClient();

  // Get all job titles
  const { data: jobTitles } = await supabaseAdmin
    .from("job_titles")
    .select("id, label")
    .order("label");

  if (!jobTitles) return [];

  // Get all permissions
  const { data: perms } = await supabaseAdmin
    .from("job_title_permissions")
    .select("job_title_id, permission");

  // Build the matrix
  const permsByJobTitle = new Map<string, string[]>();
  for (const p of perms ?? []) {
    const existing = permsByJobTitle.get(p.job_title_id) ?? [];
    existing.push(p.permission);
    permsByJobTitle.set(p.job_title_id, existing);
  }

  return jobTitles.map((jt: { id: string; label: string }) => ({
    job_title_id: jt.id,
    job_title_label: jt.label,
    permissions: permsByJobTitle.get(jt.id) ?? [],
  }));
}

// ==========================================
// Write operations
// ==========================================

/**
 * Update permissions for a specific job title.
 * Replaces all existing permissions with the provided list.
 */
export async function updateJobTitlePermissions(
  jobTitleId: string,
  permissions: PermissionKey[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Seuls les administrateurs peuvent modifier les permissions" };
  }

  // Validate permissions
  const validPerms = permissions.filter((p) => ALL_PERMISSIONS.includes(p));

  const supabaseAdmin = createAdminClient();

  // Delete existing permissions for this job title
  const { error: deleteError } = await supabaseAdmin
    .from("job_title_permissions")
    .delete()
    .eq("job_title_id", jobTitleId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Insert new permissions
  if (validPerms.length > 0) {
    const rows = validPerms.map((permission) => ({
      job_title_id: jobTitleId,
      permission,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("job_title_permissions")
      .insert(rows);

    if (insertError) {
      return { success: false, error: insertError.message };
    }
  }

  // Get job title label for audit log
  const { data: jt } = await supabaseAdmin
    .from("job_titles")
    .select("label")
    .eq("id", jobTitleId)
    .single();

  await auditLog(user.id, "update", "job_title_permissions", jobTitleId, {
    job_title: jt?.label ?? jobTitleId,
    permissions: validPerms,
  });

  revalidatePath("/admin/permissions");
  revalidatePath("/", "layout");

  return { success: true };
}
