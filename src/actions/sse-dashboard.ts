"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SseDashboard } from "@/lib/types/database";
import { createNotificationForAll } from "@/actions/notifications";

// ==========================================
// SSE DASHBOARDS
// ==========================================

export async function getSseDashboards(): Promise<SseDashboard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sse_dashboards")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return (data as SseDashboard[]) ?? [];
}

export async function getSseDashboard(id: string): Promise<SseDashboard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sse_dashboards")
    .select("*")
    .eq("id", id)
    .single();

  return data as SseDashboard | null;
}

export async function getSseDashboardByMonth(
  month: number,
  year: number
): Promise<SseDashboard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sse_dashboards")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .single();

  return data as SseDashboard | null;
}

export async function getLatestSseDashboard(): Promise<SseDashboard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sse_dashboards")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .single();

  return data as SseDashboard | null;
}

export async function createSseDashboard(
  dashboard: Omit<SseDashboard, "id" | "created_by" | "created_at" | "updated_at">
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifie" };

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "responsable_qse"].includes(profile.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const { data, error } = await supabase
    .from("sse_dashboards")
    .insert({
      ...dashboard,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Un tableau existe deja pour ce mois" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/qse/tableau-sse");
  revalidatePath("/admin/tableau-sse");

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const monthLabel = monthNames[dashboard.month - 1] ?? "";

  await createNotificationForAll({
    type: "system",
    title: "Nouveau tableau de bord SSE",
    message: `Le tableau de bord SSE de ${monthLabel} ${dashboard.year} a été publié`,
    link: "/qse/tableau-sse",
    excludeUserId: user.id,
  });

  return { success: true, id: data?.id };
}

export async function updateSseDashboard(
  id: string,
  dashboard: Partial<Omit<SseDashboard, "id" | "created_by" | "created_at" | "updated_at">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifie" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "responsable_qse"].includes(profile.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const { error } = await supabase
    .from("sse_dashboards")
    .update({
      ...dashboard,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Un tableau existe deja pour ce mois" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/qse/tableau-sse");
  revalidatePath("/admin/tableau-sse");

  if (dashboard.month && dashboard.year) {
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const monthLabel = monthNames[(dashboard.month as number) - 1] ?? "";

    await createNotificationForAll({
      type: "system",
      title: "Tableau de bord SSE mis à jour",
      message: `Le tableau de bord SSE de ${monthLabel} ${dashboard.year} a été modifié`,
      link: "/qse/tableau-sse",
      excludeUserId: user.id,
    });
  }

  return { success: true };
}

export async function deleteSseDashboard(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifie" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "responsable_qse"].includes(profile.role)) {
    return { success: false, error: "Acces refuse" };
  }

  const { error } = await supabase
    .from("sse_dashboards")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/tableau-sse");
  revalidatePath("/admin/tableau-sse");
  return { success: true };
}
