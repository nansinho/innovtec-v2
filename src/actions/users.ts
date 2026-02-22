"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Profile, UserRole } from "@/lib/types/database";

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("last_name", { ascending: true });

  return (data as Profile[]) ?? [];
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify caller is admin or rh
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

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
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    return { success: false, error: "Accès refusé" };
  }

  // Prevent deactivating yourself
  if (userId === user.id) {
    return { success: false, error: "Vous ne pouvez pas vous désactiver vous-même" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
