"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DangerReport, Rex, QseContent, QseContentSection, QseDocument } from "@/lib/types/database";

// ==========================================
// POLITIQUE QSE
// ==========================================

export async function getQseContent(type: string): Promise<QseContent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qse_content")
    .select("*")
    .eq("type", type)
    .order("year", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  return data as QseContent | null;
}

export async function getAllQseContent(type: string): Promise<QseContent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qse_content")
    .select("*")
    .eq("type", type)
    .order("year", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  return (data as QseContent[]) ?? [];
}

export async function saveQseContent(
  type: string,
  title: string,
  sections: QseContentSection[],
  sourceFileUrl?: string,
  id?: string,
  year?: number | null,
  dateSignature?: string | null,
  documents?: QseDocument[],
  engagementText?: string,
  engagementLieu?: string,
  signataires?: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const updateData: Record<string, unknown> = {
    title,
    sections,
    updated_by: user.id,
  };
  if (sourceFileUrl !== undefined) updateData.source_file_url = sourceFileUrl;
  if (year !== undefined) updateData.year = year;
  if (dateSignature !== undefined) updateData.date_signature = dateSignature;
  if (documents !== undefined) updateData.documents = documents;
  if (engagementText !== undefined) updateData.engagement_text = engagementText;
  if (engagementLieu !== undefined) updateData.engagement_lieu = engagementLieu;
  if (signataires !== undefined) updateData.signataires = signataires;

  if (id) {
    const { error } = await supabase
      .from("qse_content")
      .update(updateData)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
  } else {
    const insertData: Record<string, unknown> = {
      type,
      title,
      sections,
      source_file_url: sourceFileUrl ?? "",
      updated_by: user.id,
      year: year ?? null,
      date_signature: dateSignature ?? null,
      documents: documents ?? [],
      engagement_text: engagementText ?? "",
      engagement_lieu: engagementLieu ?? "",
      signataires: signataires ?? [],
    };

    const { error } = await supabase.from("qse_content").insert(insertData);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/qse/politique");
  revalidatePath("/qse");
  return { success: true };
}

export async function createQseContent(
  type: string,
  title: string,
  sections: QseContentSection[],
  sourceFileUrl?: string,
  year?: number | null,
  dateSignature?: string | null,
  documents?: QseDocument[],
  engagementText?: string,
  engagementLieu?: string,
  signataires?: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const insertData: Record<string, unknown> = {
    type,
    title,
    sections,
    source_file_url: sourceFileUrl ?? "",
    updated_by: user.id,
    year: year ?? null,
    date_signature: dateSignature ?? null,
    documents: documents ?? [],
    engagement_text: engagementText ?? "",
    engagement_lieu: engagementLieu ?? "",
    signataires: signataires ?? [],
  };

  const { error } = await supabase.from("qse_content").insert(insertData);

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/politique");
  revalidatePath("/qse");
  return { success: true };
}

export async function deleteQseContent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("qse_content")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/politique");
  return { success: true };
}

export async function getQseFileDownloadUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 5);

  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function getQseFileUrls(
  contents: QseContent[]
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const urls: Record<string, string> = {};

  const itemsWithFiles = contents.filter(
    (c) => c.source_file_url && c.source_file_url.length > 0
  );

  if (itemsWithFiles.length === 0) return urls;

  // Generate signed URLs (1 hour) for display
  const results = await Promise.all(
    itemsWithFiles.map(async (item) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(item.source_file_url, 60 * 60);
      return { id: item.id, url: data?.signedUrl };
    })
  );

  for (const r of results) {
    if (r.url) urls[r.id] = r.url;
  }

  return urls;
}

// ==========================================
// QSE DOCUMENT FILES (Documents Obligatoires)
// ==========================================

export async function uploadQseDocumentFile(
  formData: FormData
): Promise<{ filePath?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Aucun fichier fourni" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const filePath = `qse/documents-obligatoires/${Date.now()}-${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) return { error: error.message };
  return { filePath };
}

export async function deleteQseDocumentFile(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase.storage
    .from("documents")
    .remove([filePath]);

  if (error) return { success: false, error: error.message };
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

export async function getRexById(id: string): Promise<Rex | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rex")
    .select("*, author:profiles!rex_author_id_fkey(first_name, last_name)")
    .eq("id", id)
    .single();

  return (data as unknown as Rex) ?? null;
}

export interface CreateRexInput {
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  rex_number?: string;
  rex_year?: number | null;
  lieu?: string;
  date_evenement?: string | null;
  horaire?: string;
  faits?: string;
  faits_photo_url?: string;
  causes?: string;
  causes_photo_url?: string;
  actions_engagees?: string;
  actions_photo_url?: string;
  vigilance?: string;
  vigilance_photo_url?: string;
  deja_arrive?: string[];
  type_evenement?: string;
  source_file_url?: string;
}

export async function createRex(
  rex: CreateRexInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const insertData: Record<string, unknown> = {
    title: rex.title,
    description: rex.description,
    lessons_learned: rex.lessons_learned || "",
    chantier: rex.chantier || "",
    author_id: user.id,
  };

  if (rex.rex_number !== undefined) insertData.rex_number = rex.rex_number;
  if (rex.rex_year !== undefined) insertData.rex_year = rex.rex_year;
  if (rex.lieu !== undefined) insertData.lieu = rex.lieu;
  if (rex.date_evenement !== undefined) insertData.date_evenement = rex.date_evenement;
  if (rex.horaire !== undefined) insertData.horaire = rex.horaire;
  if (rex.faits !== undefined) insertData.faits = rex.faits;
  if (rex.faits_photo_url !== undefined) insertData.faits_photo_url = rex.faits_photo_url;
  if (rex.causes !== undefined) insertData.causes = rex.causes;
  if (rex.causes_photo_url !== undefined) insertData.causes_photo_url = rex.causes_photo_url;
  if (rex.actions_engagees !== undefined) insertData.actions_engagees = rex.actions_engagees;
  if (rex.actions_photo_url !== undefined) insertData.actions_photo_url = rex.actions_photo_url;
  if (rex.vigilance !== undefined) insertData.vigilance = rex.vigilance;
  if (rex.vigilance_photo_url !== undefined) insertData.vigilance_photo_url = rex.vigilance_photo_url;
  if (rex.deja_arrive !== undefined) insertData.deja_arrive = rex.deja_arrive;
  if (rex.type_evenement !== undefined) insertData.type_evenement = rex.type_evenement;
  if (rex.source_file_url !== undefined) insertData.source_file_url = rex.source_file_url;

  const { data, error } = await supabase
    .from("rex")
    .insert(insertData)
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/rex");
  return { success: true, id: data?.id };
}

export async function updateRex(
  id: string,
  rex: Partial<CreateRexInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const updateData: Record<string, unknown> = {};

  if (rex.title !== undefined) updateData.title = rex.title;
  if (rex.description !== undefined) updateData.description = rex.description;
  if (rex.lessons_learned !== undefined) updateData.lessons_learned = rex.lessons_learned;
  if (rex.chantier !== undefined) updateData.chantier = rex.chantier;
  if (rex.rex_number !== undefined) updateData.rex_number = rex.rex_number;
  if (rex.rex_year !== undefined) updateData.rex_year = rex.rex_year;
  if (rex.lieu !== undefined) updateData.lieu = rex.lieu;
  if (rex.date_evenement !== undefined) updateData.date_evenement = rex.date_evenement;
  if (rex.horaire !== undefined) updateData.horaire = rex.horaire;
  if (rex.faits !== undefined) updateData.faits = rex.faits;
  if (rex.faits_photo_url !== undefined) updateData.faits_photo_url = rex.faits_photo_url;
  if (rex.causes !== undefined) updateData.causes = rex.causes;
  if (rex.causes_photo_url !== undefined) updateData.causes_photo_url = rex.causes_photo_url;
  if (rex.actions_engagees !== undefined) updateData.actions_engagees = rex.actions_engagees;
  if (rex.actions_photo_url !== undefined) updateData.actions_photo_url = rex.actions_photo_url;
  if (rex.vigilance !== undefined) updateData.vigilance = rex.vigilance;
  if (rex.vigilance_photo_url !== undefined) updateData.vigilance_photo_url = rex.vigilance_photo_url;
  if (rex.deja_arrive !== undefined) updateData.deja_arrive = rex.deja_arrive;
  if (rex.type_evenement !== undefined) updateData.type_evenement = rex.type_evenement;
  if (rex.source_file_url !== undefined) updateData.source_file_url = rex.source_file_url;

  const { error } = await supabase
    .from("rex")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/rex");
  revalidatePath(`/qse/rex/${id}`);
  return { success: true };
}

export async function deleteRex(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase.from("rex").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/qse/rex");
  return { success: true };
}

export async function uploadRexPhoto(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Aucun fichier fourni" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const section = (formData.get("section") as string) || "photo";
  const filePath = `qse/rex/${section}-${Date.now()}-${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl };
}

export async function getRexPhotoUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  if (!filePath) return { error: "Chemin vide" };

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 60);

  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
