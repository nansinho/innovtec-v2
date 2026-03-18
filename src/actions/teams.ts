"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/audit-logger";

export interface Team {
  id: string;
  label: string;
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id, label")
    .order("label", { ascending: true });

  return (data as Team[]) ?? [];
}

export async function addTeam(
  label: string
): Promise<{ success: boolean; team?: Team; error?: string }> {
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
    .from("teams")
    .insert({ label: label.trim() })
    .select("id, label")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Cette équipe existe déjà" };
    }
    return { success: false, error: error.message };
  }

  await auditLog(user.id, "create", "team", data?.id ?? null, { label: label.trim() });
  return { success: true, team: data as Team };
}

export async function deleteTeam(
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
    .from("teams")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "delete", "team", id, {});
  return { success: true };
}
