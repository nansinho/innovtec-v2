"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Department {
  id: string;
  label: string;
}

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, label")
    .order("label", { ascending: true });

  return (data as Department[]) ?? [];
}

export async function addDepartment(
  label: string
): Promise<{ success: boolean; department?: Department; error?: string }> {
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
    .from("departments")
    .insert({ label: label.trim() })
    .select("id, label")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ce département existe déjà" };
    }
    return { success: false, error: error.message };
  }

  return { success: true, department: data as Department };
}

export async function deleteDepartment(
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
    .from("departments")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
