"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Profile, UserRole } from "@/lib/types/database";

/**
 * If no admin user exists, promote the current user to admin.
 * This solves the bootstrap problem where the first user is `technicien` by default.
 */
export async function ensureAdminExists(): Promise<{
  promoted: boolean;
  hasAdmin: boolean;
}> {
  const supabaseAdmin = createAdminClient();

  // Check if any admin exists
  const { data: admins } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1);

  if (admins && admins.length > 0) {
    return { promoted: false, hasAdmin: true };
  }

  // No admin exists — promote the current user
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

  revalidatePath("/", "layout");
  return { promoted: true, hasAdmin: true };
}

/**
 * Self-promote to admin. Only allowed if NO admin exists in the system.
 */
export async function promoteToAdmin(): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await ensureAdminExists();
  if (result.promoted) {
    return { success: true };
  }
  if (result.hasAdmin) {
    return {
      success: false,
      error: "Un administrateur existe déjà. Contactez-le pour changer votre rôle.",
    };
  }
  return { success: false, error: "Erreur lors de la promotion" };
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = await createClient();

  console.log("[getAllUsers] Fetching all profiles");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    console.error("[getAllUsers] Error:", error.message);
    return [];
  }

  console.log("[getAllUsers] Found", data?.length ?? 0, "users");
  return (data as Profile[]) ?? [];
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[updateUserRole] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  console.log("[updateUserRole] caller:", user.id, "target:", userId, "newRole:", role);

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    console.error("[updateUserRole] Accès refusé, caller role:", callerProfile?.role);
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error("[updateUserRole] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[updateUserRole] Success: user", userId, "→", role);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[toggleUserActive] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  console.log("[toggleUserActive] caller:", user.id, "target:", userId, "isActive:", isActive);

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    console.error("[toggleUserActive] Accès refusé, caller role:", callerProfile?.role);
    return { success: false, error: "Accès refusé" };
  }

  if (userId === user.id) {
    console.error("[toggleUserActive] Tentative d'auto-désactivation");
    return { success: false, error: "Vous ne pouvez pas vous désactiver vous-même" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) {
    console.error("[toggleUserActive] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[toggleUserActive] Success: user", userId, "→ active:", isActive);
  revalidatePath("/admin/users");
  return { success: true };
}
