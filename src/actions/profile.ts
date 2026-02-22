"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Profile,
  UserExperience,
  UserDiploma,
  UserFormation,
} from "@/lib/types/database";

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

  if (!user) return { success: false, error: "Non authentifié" };

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

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  revalidatePath("/", "layout");
  return { success: true };
}

// ==========================================
// EXPÉRIENCES
// ==========================================

export async function getExperiences(): Promise<UserExperience[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("user_experiences")
    .select("*")
    .eq("user_id", user.id)
    .order("date_start", { ascending: false });

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
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const record = { ...data, user_id: user.id };

  const { error } = data.id
    ? await supabase
        .from("user_experiences")
        .update(record)
        .eq("id", data.id)
        .eq("user_id", user.id)
    : await supabase.from("user_experiences").insert(record);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  return { success: true };
}

export async function deleteExperience(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("user_experiences")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  return { success: true };
}

// ==========================================
// DIPLÔMES
// ==========================================

export async function getDiplomas(): Promise<UserDiploma[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("user_diplomas")
    .select("*")
    .eq("user_id", user.id)
    .order("year_obtained", { ascending: false });

  return (data as UserDiploma[]) ?? [];
}

export async function upsertDiploma(data: {
  id?: string;
  title: string;
  school: string;
  year_obtained: number | null;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const record = { ...data, user_id: user.id };

  const { error } = data.id
    ? await supabase
        .from("user_diplomas")
        .update(record)
        .eq("id", data.id)
        .eq("user_id", user.id)
    : await supabase.from("user_diplomas").insert(record);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  return { success: true };
}

export async function deleteDiploma(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("user_diplomas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  return { success: true };
}

// ==========================================
// FORMATIONS PERSONNELLES
// ==========================================

export async function getUserFormations(): Promise<UserFormation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("user_formations")
    .select("*")
    .eq("user_id", user.id)
    .order("date_obtained", { ascending: false });

  return (data as UserFormation[]) ?? [];
}

export async function upsertUserFormation(data: {
  id?: string;
  title: string;
  organisme: string;
  date_obtained: string | null;
  expiry_date: string | null;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const record = { ...data, user_id: user.id };

  const { error } = data.id
    ? await supabase
        .from("user_formations")
        .update(record)
        .eq("id", data.id)
        .eq("user_id", user.id)
    : await supabase.from("user_formations").insert(record);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
  return { success: true };
}

export async function deleteUserFormation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("user_formations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profil");
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

  if (!user || !user.email)
    return { success: false, error: "Non authentifié" };

  if (data.newPassword.length < 6) {
    return {
      success: false,
      error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
    };
  }

  // Verify current password by attempting sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ==========================================
// DOCUMENTS UTILISATEUR
// ==========================================

export async function getUserDocuments() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
