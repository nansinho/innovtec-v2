"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  UserExperience,
  UserDiploma,
  UserFormation,
} from "@/lib/types/database";

async function resolveUserId(targetUserId?: string): Promise<{ userId: string; isAdmin: boolean } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (!targetUserId || targetUserId === user.id) {
    return { userId: user.id, isAdmin: false };
  }

  // Check caller is admin/rh
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    return null;
  }

  return { userId: targetUserId, isAdmin: true };
}

// ==========================================
// PROFIL
// ==========================================

export async function updateProfile(data: {
  first_name: string;
  last_name: string;
  job_title: string;
  phone: string;
  date_of_birth: string | null;
  hire_date: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[updateProfile] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  console.log("[updateProfile] userId:", user.id, "data:", {
    first_name: data.first_name,
    last_name: data.last_name,
    job_title: data.job_title,
    phone: data.phone ? "***" : "",
    date_of_birth: data.date_of_birth ? "set" : "null",
    hire_date: data.hire_date ? "set" : "null",
  });

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      job_title: data.job_title,
      phone: data.phone,
      date_of_birth: data.date_of_birth || null,
      hire_date: data.hire_date || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[updateProfile] Success for user:", user.id);
  revalidatePath("/profil");
  revalidatePath("/", "layout");
  return { success: true };
}

// ==========================================
// EXPÉRIENCES
// ==========================================

export async function getExperiences(targetUserId?: string): Promise<UserExperience[]> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_experiences")
    .select("*")
    .eq("user_id", resolved.userId)
    .order("date_start", { ascending: false });

  if (error) {
    console.error("[getExperiences] Error:", error.message);
    return [];
  }

  return (data as UserExperience[]) ?? [];
}

export async function upsertExperience(data: {
  id?: string;
  company: string;
  job_title: string;
  location: string;
  date_start: string;
  date_end: string | null;
  description: string;
}, targetUserId?: string): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { id, ...rest } = data;
  const record = { ...rest, user_id: resolved.userId };

  const { error } = id
    ? await supabase
        .from("user_experiences")
        .update(record)
        .eq("id", id)
        .eq("user_id", resolved.userId)
    : await supabase.from("user_experiences").insert(record);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}

export async function deleteExperience(
  id: string,
  targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { error } = await supabase
    .from("user_experiences")
    .delete()
    .eq("id", id)
    .eq("user_id", resolved.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}

// ==========================================
// DIPLÔMES
// ==========================================

export async function getDiplomas(targetUserId?: string): Promise<UserDiploma[]> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_diplomas")
    .select("*")
    .eq("user_id", resolved.userId)
    .order("year_obtained", { ascending: false });

  if (error) return [];

  return (data as UserDiploma[]) ?? [];
}

export async function upsertDiploma(data: {
  id?: string;
  title: string;
  school: string;
  year_obtained: number | null;
  description: string;
}, targetUserId?: string): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { id, ...rest } = data;
  const record = { ...rest, user_id: resolved.userId };

  const { error } = id
    ? await supabase.from("user_diplomas").update(record).eq("id", id).eq("user_id", resolved.userId)
    : await supabase.from("user_diplomas").insert(record);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}

export async function deleteDiploma(
  id: string,
  targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { error } = await supabase
    .from("user_diplomas")
    .delete()
    .eq("id", id)
    .eq("user_id", resolved.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}

// ==========================================
// FORMATIONS PERSONNELLES
// ==========================================

export async function getUserFormations(targetUserId?: string): Promise<UserFormation[]> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_formations")
    .select("*")
    .eq("user_id", resolved.userId)
    .order("date_obtained", { ascending: false });

  if (error) return [];

  return (data as UserFormation[]) ?? [];
}

export async function upsertUserFormation(data: {
  id?: string;
  title: string;
  organisme: string;
  date_obtained: string | null;
  expiry_date: string | null;
  description: string;
}, targetUserId?: string): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { id, ...rest } = data;
  const record = { ...rest, user_id: resolved.userId };

  const { error } = id
    ? await supabase.from("user_formations").update(record).eq("id", id).eq("user_id", resolved.userId)
    : await supabase.from("user_formations").insert(record);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}

export async function deleteUserFormation(
  id: string,
  targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { error } = await supabase
    .from("user_formations")
    .delete()
    .eq("id", id)
    .eq("user_id", resolved.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}

// ==========================================
// MOT DE PASSE
// ==========================================

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    console.error("[updatePassword] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  if (data.newPassword.length < 6) {
    return {
      success: false,
      error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
    };
  }

  console.log("[updatePassword] userId:", user.id);

  // Verify current password by attempting sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });

  if (signInError) {
    console.error("[updatePassword] Wrong current password for user:", user.id);
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (error) {
    console.error("[updatePassword] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[updatePassword] Success for user:", user.id);

  // Clear must_change_password flag
  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  return { success: true };
}

// ==========================================
// DOCUMENTS UTILISATEUR
// ==========================================

export async function getUserDocuments(targetUserId?: string) {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("uploaded_by", resolved.userId)
    .order("created_at", { ascending: false });

  if (error) return [];

  return data ?? [];
}

// ==========================================
// CONTACT D'URGENCE
// ==========================================

export async function updateEmergencyContact(
  data: {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relation: string;
  },
  targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
  const resolved = await resolveUserId(targetUserId);
  if (!resolved) return { success: false, error: "Non authentifié" };

  const supabase = resolved.isAdmin ? createAdminClient() : await createClient();

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", resolved.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath(`/admin/users/${resolved.userId}`);
  return { success: true };
}
