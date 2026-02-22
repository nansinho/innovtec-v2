"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DangerReport, Rex, QseContent, QseContentSection } from "@/lib/types/database";

// ==========================================
// POLITIQUE QSE
// ==========================================

export async function getQseContent(type: string): Promise<QseContent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qse_content")
    .select("*")
    .eq("type", type)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  return data as QseContent | null;
}

export async function saveQseContent(
  type: string,
  title: string,
  sections: QseContentSection[],
  sourceFileUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Check if content exists for this type
  const { data: existing } = await supabase
    .from("qse_content")
    .select("id")
    .eq("type", type)
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("qse_content")
      .update({
        title,
        sections,
        source_file_url: sourceFileUrl ?? "",
        updated_by: user.id,
      })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("qse_content").insert({
      type,
      title,
      sections,
      source_file_url: sourceFileUrl ?? "",
      updated_by: user.id,
    });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/qse/politique");
  return { success: true };
}

// ==========================================
// SITUATIONS DANGEREUSES
// ==========================================

export async function getDangerReports(): Promise<DangerReport[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("danger_reports")
    .select("*, reporter:profiles!danger_reports_reported_by_fkey(first_name, last_name), assignee:profiles!danger_reports_assigned_to_fkey(first_name, last_name)")
    .order("created_at", { ascending: false });

  return (data as unknown as DangerReport[]) ?? [];
}

export async function createDangerReport(report: {
  title: string;
  description: string;
  location: string;
  severity: number;
  photo_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase.from("danger_reports").insert({
    title: report.title,
    description: report.description,
    location: report.location,
    severity: report.severity,
    photo_url: report.photo_url ?? "",
    reported_by: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/dangers");
  return { success: true };
}

export async function updateDangerStatus(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = { status };
  if (status === "resolu") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("danger_reports")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/dangers");
  return { success: true };
}

// ==========================================
// REX (Retours d'expérience)
// ==========================================

export async function getRexList(): Promise<Rex[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rex")
    .select("*, author:profiles!rex_author_id_fkey(first_name, last_name)")
    .order("created_at", { ascending: false });

  return (data as unknown as Rex[]) ?? [];
}

export async function createRex(rex: {
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase.from("rex").insert({
    title: rex.title,
    description: rex.description,
    lessons_learned: rex.lessons_learned,
    chantier: rex.chantier,
    author_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/rex");
  return { success: true };
}
