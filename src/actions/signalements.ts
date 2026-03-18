"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { DangerReport, SignalementCategory, DangerStatus, SignalementPriority } from "@/lib/types/database";
import { createNotificationForUser } from "@/actions/notifications";
import { auditLog } from "@/lib/audit-logger";

// ==========================================
// HELPERS
// ==========================================

function revalidateAll() {
  revalidatePath("/qse/signalements");
  revalidatePath("/qse");
  revalidatePath("/");
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getAuthProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  return profile;
}

function isQseManager(role: string) {
  return ["admin", "rh", "responsable_qse"].includes(role);
}

async function resolvePhotoUrls(report: DangerReport): Promise<DangerReport> {
  const urls = report.photo_urls;
  if (!urls || urls.length === 0) return report;

  const supabase = await createClient();
  const resolved = await Promise.all(
    urls.map(async (path) => {
      // If already a full URL (legacy data), keep it
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 60 * 60); // 1h
      return data?.signedUrl ?? path;
    })
  );
  return { ...report, photo_urls: resolved };
}

// ==========================================
// CATEGORIES
// ==========================================

export async function getSignalementCategories(): Promise<SignalementCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("signalement_categories")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (data as SignalementCategory[]) ?? [];
}

export async function getAllSignalementCategories(): Promise<SignalementCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("signalement_categories")
    .select("*")
    .order("position", { ascending: true });

  return (data as SignalementCategory[]) ?? [];
}

export async function createSignalementCategory(
  name: string,
  color: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // Get next position
  const { data: last } = await supabase
    .from("signalement_categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("signalement_categories").insert({
    name,
    color,
    position,
  });

  if (error) return { success: false, error: error.message };

  await auditLog(profile.id, "create", "signalement", null, { name, type: "category" });

  revalidateAll();
  return { success: true };
}

export async function updateSignalementCategory(
  id: string,
  data: { name?: string; color?: string; is_active?: boolean; position?: number }
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("signalement_categories")
    .update(data)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await auditLog(profile.id, "update", "signalement", id, { type: "category" });

  revalidateAll();
  return { success: true };
}

export async function deleteSignalementCategory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("signalement_categories")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await auditLog(profile.id, "delete", "signalement", id, { type: "category" });

  revalidateAll();
  return { success: true };
}

// ==========================================
// SIGNALEMENTS
// ==========================================

const SIGNALEMENT_SELECT = `
  *,
  reporter:profiles!danger_reports_reported_by_fkey(first_name, last_name),
  assignee:profiles!danger_reports_assigned_to_fkey(first_name, last_name),
  category:signalement_categories!danger_reports_category_id_fkey(id, name, color)
`;

export async function getSignalements(): Promise<DangerReport[]> {
  const profile = await getAuthProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("danger_reports")
    .select(SIGNALEMENT_SELECT)
    .order("created_at", { ascending: false });

  if (!data) return [];

  let reports = data as unknown as DangerReport[];

  // Resolve photo signed URLs
  reports = await Promise.all(reports.map(resolvePhotoUrls));

  // If not QSE manager, mask anonymous reporters
  if (!isQseManager(profile.role)) {
    return reports.map((d) => {
      if (d.is_anonymous) {
        return { ...d, reporter: null, reported_by: "" };
      }
      return d;
    });
  }

  return reports;
}

export async function getSignalement(id: string): Promise<DangerReport | null> {
  const profile = await getAuthProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("danger_reports")
    .select(SIGNALEMENT_SELECT)
    .eq("id", id)
    .single();

  if (!data) return null;

  let report = data as unknown as DangerReport;

  // Resolve photo signed URLs
  report = await resolvePhotoUrls(report);

  // Mask anonymous reporter for non-managers (unless it's their own)
  if (report.is_anonymous && !isQseManager(profile.role) && report.reported_by !== profile.id) {
    return { ...report, reporter: null, reported_by: "" };
  }

  return report;
}

export async function getMySignalements(): Promise<DangerReport[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("danger_reports")
    .select(SIGNALEMENT_SELECT)
    .eq("reported_by", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];
  return Promise.all((data as unknown as DangerReport[]).map(resolvePhotoUrls));
}

export async function createSignalement(report: {
  title: string;
  description: string;
  category_id: string;
  priority: SignalementPriority;
  incident_date: string;
  incident_time?: string;
  chantier: string;
  is_anonymous: boolean;
  photo_urls?: string[];
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("danger_reports")
    .insert({
      title: report.title,
      description: report.description,
      category_id: report.category_id,
      priority: report.priority,
      incident_date: report.incident_date,
      incident_time: report.incident_time || null,
      location: report.chantier,
      chantier: report.chantier,
      is_anonymous: report.is_anonymous,
      photo_urls: report.photo_urls ?? [],
      photo_url: report.photo_urls?.[0] ?? "",
      reported_by: user.id,
      severity: report.priority === "critique" ? 5 : report.priority === "haute" ? 4 : report.priority === "moyenne" ? 3 : 1,
      status: "signale" as DangerStatus,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Notify QSE managers
  const supabaseAdmin = createAdminClient();
  const { data: qseManagers } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .in("role", ["admin", "responsable_qse"])
    .eq("is_active", true);

  if (qseManagers) {
    for (const manager of qseManagers) {
      if (manager.id !== user.id) {
        await createNotificationForUser({
          user_id: manager.id,
          type: "danger",
          title: "Nouveau signalement",
          message: `Un nouveau signalement a été créé : ${report.title}`,
          link: `/qse/signalements/${data.id}`,
          related_id: data.id,
        });
      }
    }
  }

  await auditLog(user.id, "create", "signalement", data.id, { title: report.title, priority: report.priority });

  revalidateAll();
  return { success: true, id: data.id };
}

export async function updateSignalementStatus(
  id: string,
  status: DangerStatus
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

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

  // Notify the reporter
  const { data: report } = await supabase
    .from("danger_reports")
    .select("reported_by, title")
    .eq("id", id)
    .single();

  if (report?.reported_by) {
    const statusLabels: Record<string, string> = {
      signale: "Signalé",
      en_cours: "En cours de traitement",
      resolu: "Résolu",
      cloture: "Clôturé",
    };
    await createNotificationForUser({
      user_id: report.reported_by,
      type: "danger",
      title: "Signalement mis à jour",
      message: `Votre signalement "${report.title}" est passé en statut : ${statusLabels[status] ?? status}`,
      link: `/qse/signalements/${id}`,
      related_id: id,
    });
  }

  await auditLog(profile.id, "status_change", "signalement", id, { status });

  revalidateAll();
  return { success: true };
}

export async function assignSignalement(
  id: string,
  assignedTo: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("danger_reports")
    .update({ assigned_to: assignedTo })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await auditLog(profile.id, "assign", "signalement", id, { assigned_to: assignedTo });

  revalidateAll();
  return { success: true };
}

// ==========================================
// PHOTO UPLOAD
// ==========================================

export async function uploadSignalementPhoto(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "Aucun fichier" };

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { success: false, error: "Fichier trop volumineux (max 10MB)" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Type de fichier non autorisé (JPG, PNG, WebP uniquement)" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `signalements/${user.id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  return { success: true, url: filePath };
}

export async function deleteSignalement(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // Fetch the report to get photo paths
  const { data: report } = await supabase
    .from("danger_reports")
    .select("photo_urls")
    .eq("id", id)
    .single();

  if (!report) {
    return { success: false, error: "Signalement introuvable" };
  }

  // Delete photos from storage
  const photoPaths = (report.photo_urls ?? []).filter(
    (p: string) => p && !p.startsWith("http")
  );
  if (photoPaths.length > 0) {
    await supabase.storage.from("documents").remove(photoPaths);
  }

  // Delete the report
  const { error } = await supabase
    .from("danger_reports")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await auditLog(profile.id, "delete", "signalement", id, {});

  revalidateAll();
  return { success: true };
}
