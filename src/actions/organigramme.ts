"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit-logger";
import type { Profile } from "@/lib/types/database";
import Anthropic from "@anthropic-ai/sdk";

// ==========================================
// TYPES
// ==========================================

export type OrgChartProfile = Pick<
  Profile,
  | "id"
  | "first_name"
  | "last_name"
  | "job_title"
  | "department"
  | "team"
  | "agency"
  | "avatar_url"
  | "manager_id"
  | "role"
  | "email"
  | "phone"
  | "gender"
>;

export interface ImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  department?: string;
  team?: string;
  manager_email?: string;
}

export interface ImportResult {
  total: number;
  updated: number;
  errors: { row: number; email: string; message: string }[];
}

export interface AIExtractedPerson {
  name: string;
  job_title: string | null;
  manager_name: string | null;
}

// ==========================================
// HELPERS
// ==========================================

async function getCallerProfile() {
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

  return profile ? { ...profile, authId: user.id } : null;
}

function revalidateAll() {
  revalidatePath("/equipe/organigramme");
  revalidatePath("/equipe/trombinoscope");
  revalidatePath("/admin/users");
}

// ==========================================
// READ
// ==========================================

export async function getOrgChartData(): Promise<OrgChartProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, job_title, department, team, agency, avatar_url, manager_id, role, email, phone, gender"
    )
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  if (error) {
    console.error("[getOrgChartData] Error:", error.message);
    return [];
  }

  return (data as OrgChartProfile[]) ?? [];
}

// ==========================================
// UPDATE MANAGER
// ==========================================

export async function updateManager(
  userId: string,
  managerId: string | null
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !["admin", "rh"].includes(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  if (userId === managerId) {
    return { success: false, error: "Un collaborateur ne peut pas être son propre manager" };
  }

  const supabaseAdmin = createAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name, manager_id")
    .eq("id", userId)
    .single();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ manager_id: managerId })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await auditLog(caller.authId, "update_manager", "user", userId, {
    user_name: targetProfile
      ? `${targetProfile.first_name} ${targetProfile.last_name}`
      : "Inconnu",
    previous_manager_id: targetProfile?.manager_id,
    new_manager_id: managerId,
  });

  revalidateAll();
  return { success: true };
}

// ==========================================
// IMPORT (Excel/CSV)
// ==========================================

export async function importOrgChart(
  rows: ImportRow[]
): Promise<ImportResult> {
  const caller = await getCallerProfile();
  if (!caller || !["admin", "rh"].includes(caller.role)) {
    return { total: 0, updated: 0, errors: [{ row: 0, email: "", message: "Accès refusé" }] };
  }

  const supabaseAdmin = createAdminClient();

  const { data: allProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, first_name, last_name");

  if (!allProfiles) {
    return { total: rows.length, updated: 0, errors: [{ row: 0, email: "", message: "Erreur lors de la récupération des profils" }] };
  }

  const emailToId = new Map<string, string>();
  for (const p of allProfiles) {
    emailToId.set(p.email.toLowerCase(), p.id);
  }

  const result: ImportResult = { total: rows.length, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row.email?.trim().toLowerCase();

    if (!email) {
      result.errors.push({ row: i + 1, email: "", message: "Email manquant" });
      continue;
    }

    const userId = emailToId.get(email);
    if (!userId) {
      result.errors.push({ row: i + 1, email, message: "Collaborateur introuvable" });
      continue;
    }

    const updateData: Record<string, unknown> = {};

    if (row.job_title?.trim()) updateData.job_title = row.job_title.trim();
    if (row.department?.trim()) updateData.department = row.department.trim();
    if (row.team?.trim()) updateData.team = row.team.trim();

    if (row.manager_email?.trim()) {
      const managerEmail = row.manager_email.trim().toLowerCase();
      const managerId = emailToId.get(managerEmail);
      if (managerId) {
        if (managerId === userId) {
          result.errors.push({ row: i + 1, email, message: "Un collaborateur ne peut pas être son propre manager" });
          continue;
        }
        updateData.manager_id = managerId;
      } else {
        result.errors.push({ row: i + 1, email, message: `Manager introuvable : ${row.manager_email}` });
        continue;
      }
    }

    if (Object.keys(updateData).length === 0) {
      continue;
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      result.errors.push({ row: i + 1, email, message: error.message });
    } else {
      result.updated++;
    }
  }

  await auditLog(caller.authId, "import_orgchart", "orgchart", null, {
    total: result.total,
    updated: result.updated,
    errors_count: result.errors.length,
  });

  revalidateAll();
  return result;
}

// ==========================================
// AI IMAGE ANALYSIS
// ==========================================

export async function analyzeOrgChartImage(
  imageBase64: string,
  mimeType: string
): Promise<AIExtractedPerson[] | { error: string }> {
  const caller = await getCallerProfile();
  if (!caller || !["admin", "rh"].includes(caller.role)) {
    return { error: "Accès refusé" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "Clé API Anthropic non configurée (ANTHROPIC_API_KEY)" };
  }

  const anthropic = new Anthropic({ apiKey });

  // Validate mime type
  const validMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  let mediaType = mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  if (!validMimeTypes.includes(mimeType)) {
    return { error: "Type de fichier non supporté" };
  }

  // For PDF, use document type; for images use image type
  const isPdf = mimeType === "application/pdf";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "application/pdf" as const,
                    data: imageBase64,
                  },
                }
              : {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: mediaType,
                    data: imageBase64,
                  },
                },
            {
              type: "text",
              text: `Analyse cet organigramme d'entreprise. Extrais TOUTES les personnes visibles avec :
- name: le nom complet (prénom et nom de famille)
- job_title: le poste ou titre professionnel (si visible, sinon null)
- manager_name: le nom complet du manager direct — la personne directement au-dessus dans la hiérarchie (si c'est une personne racine sans manager au-dessus, mettre null)

IMPORTANT:
- Extrais TOUTES les personnes visibles, pas seulement les managers
- Le manager est la personne directement au-dessus dans l'arbre hiérarchique, reliée par une ligne
- Retourne UNIQUEMENT un JSON array valide, sans texte avant ou après
- Format: [{"name": "Prénom Nom", "job_title": "Poste" | null, "manager_name": "Prénom Nom du manager" | null}]`,
            },
          ],
        },
      ],
    });

    // Extract text response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { error: "Pas de réponse textuelle de l'IA" };
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(jsonStr) as AIExtractedPerson[];

    if (!Array.isArray(parsed)) {
      return { error: "Format de réponse invalide" };
    }

    await auditLog(caller.authId, "analyze_orgchart_image", "orgchart", null, {
      extracted_count: parsed.length,
    });

    return parsed;
  } catch (err) {
    console.error("[analyzeOrgChartImage] Error:", err);
    return { error: "Erreur lors de l'analyse de l'image par l'IA" };
  }
}

// ==========================================
// APPLY AI IMPORT
// ==========================================

export async function applyAIImport(
  assignments: { profileId: string; managerId: string | null }[]
): Promise<ImportResult> {
  const caller = await getCallerProfile();
  if (!caller || !["admin", "rh"].includes(caller.role)) {
    return { total: 0, updated: 0, errors: [{ row: 0, email: "", message: "Accès refusé" }] };
  }

  const supabaseAdmin = createAdminClient();
  const result: ImportResult = { total: assignments.length, updated: 0, errors: [] };

  for (let i = 0; i < assignments.length; i++) {
    const { profileId, managerId } = assignments[i];

    // Prevent self-assignment
    if (profileId === managerId) {
      result.errors.push({
        row: i + 1,
        email: "",
        message: "Un collaborateur ne peut pas être son propre manager",
      });
      continue;
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ manager_id: managerId })
      .eq("id", profileId);

    if (error) {
      result.errors.push({ row: i + 1, email: "", message: error.message });
    } else {
      result.updated++;
    }
  }

  await auditLog(caller.authId, "apply_ai_orgchart", "orgchart", null, {
    total: result.total,
    updated: result.updated,
    errors_count: result.errors.length,
  });

  revalidateAll();
  return result;
}
