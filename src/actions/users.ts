"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Profile, UserRole } from "@/lib/types/database";

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
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, authId: user.id } : null;
}

function isAdminOrRh(role: string) {
  return ["admin", "rh"].includes(role);
}

async function logActivity(
  userId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (e) {
    console.error("[logActivity] Failed:", e);
  }
}

function revalidateAll() {
  revalidatePath("/admin/users");
  revalidatePath("/equipe/trombinoscope");
  revalidatePath("/admin/logs");
}

// ==========================================
// BOOTSTRAP
// ==========================================

export async function ensureAdminExists(): Promise<{
  promoted: boolean;
  hasAdmin: boolean;
}> {
  const supabaseAdmin = createAdminClient();

  const { data: admins } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1);

  if (admins && admins.length > 0) {
    return { promoted: false, hasAdmin: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { promoted: false, hasAdmin: false };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (error) return { promoted: false, hasAdmin: false };

  await logActivity(user.id, "promote_to_admin", "user", user.id, {
    reason: "bootstrap",
  });

  revalidatePath("/", "layout");
  return { promoted: true, hasAdmin: true };
}

export async function promoteToAdmin(): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await ensureAdminExists();
  if (result.promoted) return { success: true };
  if (result.hasAdmin) {
    return {
      success: false,
      error: "Un administrateur existe déjà. Contactez-le pour changer votre rôle.",
    };
  }
  return { success: false, error: "Erreur lors de la promotion" };
}

// ==========================================
// READ
// ==========================================

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    console.error("[getAllUsers] Error:", error.message);
    return [];
  }

  return (data as Profile[]) ?? [];
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

// ==========================================
// CREATE
// ==========================================

export async function createUser(formData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  job_title?: string;
  phone?: string;
  gender?: string;
  department?: string;
  team?: string;
  agency?: string;
  date_of_birth?: string;
  hire_date?: string;
}): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const {
    email,
    password,
    first_name,
    last_name,
    role,
    job_title,
    phone,
    gender,
    department,
    team,
    agency,
    date_of_birth,
    hire_date,
  } = formData;

  if (!email || !password || !first_name || !last_name) {
    return { success: false, error: "Les champs email, mot de passe, prénom et nom sont obligatoires" };
  }

  if (password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name },
      });

    if (authError) {
      if (
        authError.message.includes("already been registered") ||
        authError.message.includes("already exists")
      ) {
        return { success: false, error: "Un compte existe déjà avec cet email" };
      }
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Erreur inattendue" };
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: authData.user.id,
          email,
          first_name,
          last_name,
          role,
          job_title: job_title ?? "",
          phone: phone ?? "",
          gender: gender ?? "",
          department: department ?? "",
          team: team ?? "",
          agency: agency ?? "Siège",
          date_of_birth: date_of_birth || null,
          hire_date: hire_date || null,
          must_change_password: true,
          is_active: true,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[createUser] Profile error:", profileError.message);
    }

    await logActivity(caller.authId, "create_user", "user", authData.user.id, {
      email,
      name: `${first_name} ${last_name}`,
      role,
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error("[createUser] Error:", error);
    return { success: false, error: "Erreur serveur" };
  }
}

// ==========================================
// UPDATE
// ==========================================

export async function updateUser(
  userId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: UserRole;
    job_title?: string;
    phone?: string;
    gender?: string;
    department?: string;
    team?: string;
    agency?: string;
    date_of_birth?: string | null;
    hire_date?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();

  // Get current profile for logging
  const { data: currentProfile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logActivity(caller.authId, "update_user", "user", userId, {
    changes: updateData,
    previous_email: currentProfile?.email,
    user_name: currentProfile
      ? `${currentProfile.first_name} ${currentProfile.last_name}`
      : "Inconnu",
  });

  revalidateAll();
  return { success: true };
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role, first_name, last_name, email")
    .eq("id", userId)
    .single();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await logActivity(caller.authId, "change_role", "user", userId, {
    from: targetProfile?.role,
    to: role,
    user_name: targetProfile
      ? `${targetProfile.first_name} ${targetProfile.last_name}`
      : "Inconnu",
  });

  revalidateAll();
  return { success: true };
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  if (userId === caller.authId) {
    return { success: false, error: "Vous ne pouvez pas vous désactiver vous-même" };
  }

  const supabaseAdmin = createAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", userId)
    .single();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await logActivity(
    caller.authId,
    isActive ? "reactivate_user" : "deactivate_user",
    "user",
    userId,
    {
      user_name: targetProfile
        ? `${targetProfile.first_name} ${targetProfile.last_name}`
        : "Inconnu",
      email: targetProfile?.email,
    }
  );

  revalidateAll();
  return { success: true };
}

export async function updateUserInfo(
  userId: string,
  info: { department?: string; team?: string; agency?: string }
): Promise<{ success: boolean; error?: string }> {
  return updateUser(userId, info);
}

// ==========================================
// DELETE
// ==========================================

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || caller.role !== "admin") {
    return { success: false, error: "Seul un administrateur peut supprimer un utilisateur" };
  }

  if (userId === caller.authId) {
    return { success: false, error: "Vous ne pouvez pas supprimer votre propre compte" };
  }

  const supabaseAdmin = createAdminClient();

  // Get user info for logging
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, email, role")
    .eq("id", userId)
    .single();

  if (!targetProfile) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  // Try to delete auth user (CASCADE will delete profile)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    // If auth user not found, delete profile directly
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      return { success: false, error: `Impossible de supprimer l'utilisateur : ${profileDeleteError.message}` };
    }
  }

  await logActivity(caller.authId, "delete_user", "user", userId, {
    deleted_user: `${targetProfile.first_name} ${targetProfile.last_name}`,
    email: targetProfile.email,
    role: targetProfile.role,
  });

  revalidateAll();
  return { success: true };
}

// ==========================================
// ACTIVITY LOGS
// ==========================================

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export async function getActivityLogs(
  limit = 50,
  offset = 0
): Promise<{ logs: ActivityLog[]; total: number }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { logs: [], total: 0 };
  }

  const supabaseAdmin = createAdminClient();

  const { count } = await supabaseAdmin
    .from("activity_logs")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*, user:profiles!activity_logs_user_id_fkey(first_name, last_name, email)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[getActivityLogs] Error:", error.message);
    return { logs: [], total: 0 };
  }

  return {
    logs: (data as unknown as ActivityLog[]) ?? [],
    total: count ?? 0,
  };
}
