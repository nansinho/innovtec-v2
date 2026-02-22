"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
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

export async function getExperiences(): Promise<UserExperience[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_experiences")
    .select("*")
    .eq("user_id", user.id)
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
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[upsertExperience] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  // Destructure id out to avoid inserting id: undefined
  const { id, ...rest } = data;
  const record = { ...rest, user_id: user.id };

  console.log("[upsertExperience] userId:", user.id, id ? `update id=${id}` : "insert", {
    company: rest.company,
    job_title: rest.job_title,
  });

  const { error } = id
    ? await supabase
        .from("user_experiences")
        .update(record)
        .eq("id", id)
        .eq("user_id", user.id)
    : await supabase.from("user_experiences").insert(record);

  if (error) {
    console.error("[upsertExperience] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[upsertExperience] Success");
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

  if (!user) {
    console.error("[deleteExperience] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  console.log("[deleteExperience] userId:", user.id, "id:", id);

  const { error } = await supabase
    .from("user_experiences")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteExperience] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[deleteExperience] Success");
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

  const { data, error } = await supabase
    .from("user_diplomas")
    .select("*")
    .eq("user_id", user.id)
    .order("year_obtained", { ascending: false });

  if (error) {
    console.error("[getDiplomas] Error:", error.message);
    return [];
  }

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

  if (!user) {
    console.error("[upsertDiploma] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  // Destructure id out to avoid inserting id: undefined
  const { id, ...rest } = data;
  const record = { ...rest, user_id: user.id };

  console.log("[upsertDiploma] userId:", user.id, id ? `update id=${id}` : "insert", {
    title: rest.title,
    school: rest.school,
  });

  const { error } = id
    ? await supabase
        .from("user_diplomas")
        .update(record)
        .eq("id", id)
        .eq("user_id", user.id)
    : await supabase.from("user_diplomas").insert(record);

  if (error) {
    console.error("[upsertDiploma] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[upsertDiploma] Success");
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

  if (!user) {
    console.error("[deleteDiploma] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  console.log("[deleteDiploma] userId:", user.id, "id:", id);

  const { error } = await supabase
    .from("user_diplomas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteDiploma] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[deleteDiploma] Success");
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

  const { data, error } = await supabase
    .from("user_formations")
    .select("*")
    .eq("user_id", user.id)
    .order("date_obtained", { ascending: false });

  if (error) {
    console.error("[getUserFormations] Error:", error.message);
    return [];
  }

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

  if (!user) {
    console.error("[upsertUserFormation] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  // Destructure id out to avoid inserting id: undefined
  const { id, ...rest } = data;
  const record = { ...rest, user_id: user.id };

  console.log("[upsertUserFormation] userId:", user.id, id ? `update id=${id}` : "insert", {
    title: rest.title,
    organisme: rest.organisme,
  });

  const { error } = id
    ? await supabase
        .from("user_formations")
        .update(record)
        .eq("id", id)
        .eq("user_id", user.id)
    : await supabase.from("user_formations").insert(record);

  if (error) {
    console.error("[upsertUserFormation] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[upsertUserFormation] Success");
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

  if (!user) {
    console.error("[deleteUserFormation] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  console.log("[deleteUserFormation] userId:", user.id, "id:", id);

  const { error } = await supabase
    .from("user_formations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteUserFormation] Error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("[deleteUserFormation] Success");
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

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserDocuments] Error:", error.message);
    return [];
  }

  return data ?? [];
}
