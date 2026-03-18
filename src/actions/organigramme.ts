"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit-logger";
import type { Profile } from "@/lib/types/database";

// ==========================================
// TYPES
// ==========================================

export type OrgChartProfile = Pick<
  Profile,
  | "id"
  | "first_name"
  | "last_name"
  | "job_title"
  | "department"
  | "team"
  | "agency"
  | "avatar_url"
  | "manager_id"
  | "role"
  | "email"
  | "phone"
  | "gender"
>;

export interface ImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  department?: string;
  team?: string;
  manager_email?: string;
}

export interface ImportResult {
  total: number;
  updated: number;
  errors: { row: number; email: string; message: string }[];
}

// ==========================================
// HELPERS
// ==========================================

async function getCallerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, authId: user.id } : null;
}

function revalidateAll() {
  revalidatePath("/equipe/organigramme");
  revalidatePath("/equipe/trombinoscope");
  revalidatePath("/admin/users");
}

// ==========================================
// READ
// ==========================================

export async function getOrgChartData(): Promise<OrgChartProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, job_title, department, team, agency, avatar_url, manager_id, role, email, phone, gender"
    )
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  if (error) {
    console.error("[getOrgChartData] Error:", error.message);
    return [];
  }

  return (data as OrgChartProfile[]) ?? [];
}

// ==========================================
// UPDATE MANAGER
// ==========================================

export async function updateManager(
  userId: string,
  managerId: string | null
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !["admin", "rh"].includes(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  // Prevent self-assignment
  if (userId === managerId) {
    return { success: false, error: "Un collaborateur ne peut pas être son propre manager" };
  }

  const supabaseAdmin = createAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, manager_id")
    .eq("id", userId)
    .single();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ manager_id: managerId })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await auditLog(caller.authId, "update_manager", "user", userId, {
    user_name: targetProfile
      ? `${targetProfile.first_name} ${targetProfile.last_name}`
      : "Inconnu",
    previous_manager_id: targetProfile?.manager_id,
    new_manager_id: managerId,
  });

  revalidateAll();
  return { success: true };
}

// ==========================================
// IMPORT
// ==========================================

export async function importOrgChart(
  rows: ImportRow[]
): Promise<ImportResult> {
  const caller = await getCallerProfile();
  if (!caller || !["admin", "rh"].includes(caller.role)) {
    return { total: 0, updated: 0, errors: [{ row: 0, email: "", message: "Accès refusé" }] };
  }

  const supabaseAdmin = createAdminClient();

  // Fetch all profiles to build email → id map
  const { data: allProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, first_name, last_name");

  if (!allProfiles) {
    return { total: rows.length, updated: 0, errors: [{ row: 0, email: "", message: "Erreur lors de la récupération des profils" }] };
  }

  const emailToId = new Map<string, string>();
  for (const p of allProfiles) {
    emailToId.set(p.email.toLowerCase(), p.id);
  }

  const result: ImportResult = { total: rows.length, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row.email?.trim().toLowerCase();

    if (!email) {
      result.errors.push({ row: i + 1, email: "", message: "Email manquant" });
      continue;
    }

    const userId = emailToId.get(email);
    if (!userId) {
      result.errors.push({ row: i + 1, email, message: "Collaborateur introuvable" });
      continue;
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (row.job_title?.trim()) updateData.job_title = row.job_title.trim();
    if (row.department?.trim()) updateData.department = row.department.trim();
    if (row.team?.trim()) updateData.team = row.team.trim();

    // Resolve manager
    if (row.manager_email?.trim()) {
      const managerEmail = row.manager_email.trim().toLowerCase();
      const managerId = emailToId.get(managerEmail);
      if (managerId) {
        if (managerId === userId) {
          result.errors.push({ row: i + 1, email, message: "Un collaborateur ne peut pas être son propre manager" });
          continue;
        }
        updateData.manager_id = managerId;
      } else {
        result.errors.push({ row: i + 1, email, message: `Manager introuvable : ${row.manager_email}` });
        continue;
      }
    }

    if (Object.keys(updateData).length === 0) {
      continue; // Nothing to update
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      result.errors.push({ row: i + 1, email, message: error.message });
    } else {
      result.updated++;
    }
  }

  await auditLog(caller.authId, "import_orgchart", "orgchart", null, {
    total: result.total,
    updated: result.updated,
    errors_count: result.errors.length,
  });

  revalidateAll();
  return result;
}
