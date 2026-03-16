"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface JobTitle {
  id: string;
  label: string;
}

export async function getJobTitles(): Promise<JobTitle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_titles")
    .select("id, label")
    .order("label", { ascending: true });

  return (data as JobTitle[]) ?? [];
}

export async function addJobTitle(
  label: string
): Promise<{ success: boolean; jobTitle?: JobTitle; error?: string }> {
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

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("job_titles")
    .insert({ label: label.trim() })
    .select("id, label")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ce poste existe déjà" };
    }
    return { success: false, error: error.message };
  }

  return { success: true, jobTitle: data as JobTitle };
}

export async function updateUserJobTitle(
  userId: string,
  jobTitle: string
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

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ job_title: jobTitle })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/equipe/trombinoscope");
  return { success: true };
}

export async function deleteJobTitle(
  id: string
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

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("job_titles")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
