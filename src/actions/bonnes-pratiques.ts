"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { BonnePratique } from "@/lib/types/database";
import { createNotificationForAll } from "@/actions/notifications";
import { auditLog } from "@/lib/audit-logger";

export async function getBonnesPratiques(): Promise<BonnePratique[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bonnes_pratiques")
    .select("*, author:profiles!bonnes_pratiques_author_id_fkey(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  return (data as unknown as BonnePratique[]) ?? [];
}

export async function createBonnePratique(bp: {
  title: string;
  pillar: string;
  category: string;
  description: string;
  chantier: string;
  photos: string[];
  cover_photo?: string;
  difficulty?: string;
  priority?: string;
  cost_impact?: string;
  environmental_impact?: string;
  safety_impact?: string;
  source_file_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    // Use admin client to bypass RLS for insert
    const adminSupabase = createAdminClient();

    // Base payload (always works with original schema)
    const payload: Record<string, unknown> = {
      title: bp.title,
      pillar: bp.pillar,
      category: bp.category,
      description: bp.description,
      chantier: bp.chantier,
      photos: bp.photos,
      author_id: user.id,
    };

    // Add extended fields if they have values (requires migration)
    if (bp.cover_photo) payload.cover_photo = bp.cover_photo;
    if (bp.difficulty) payload.difficulty = bp.difficulty;
    if (bp.priority) payload.priority = bp.priority;
    if (bp.cost_impact) payload.cost_impact = bp.cost_impact;
    if (bp.environmental_impact) payload.environmental_impact = bp.environmental_impact;
    if (bp.safety_impact) payload.safety_impact = bp.safety_impact;
    if (bp.source_file_url) payload.source_file_url = bp.source_file_url;

    let { error } = await adminSupabase.from("bonnes_pratiques").insert(payload);

    // Fallback: if extended fields cause error, retry with base fields only
    if (error) {
      console.error("Insert with extended fields failed:", error.message);
      const basePayload = {
        title: bp.title,
        pillar: bp.pillar,
        category: bp.category,
        description: bp.description,
        chantier: bp.chantier,
        photos: bp.photos,
        author_id: user.id,
      };
      const fallback = await adminSupabase.from("bonnes_pratiques").insert(basePayload);
      error = fallback.error;
      if (error) {
        console.error("Fallback insert also failed:", error.message);
      }
    }

    if (error) return { success: false, error: error.message };

    // Notify all users about new bonne pratique
    await createNotificationForAll({
      type: "system",
      title: "Nouvelle bonne pratique",
      message: bp.title,
      link: "/qse/bonnes-pratiques",
      excludeUserId: user.id,
    });

    await auditLog(user.id, "create", "best_practice", null, { title: bp.title, pillar: bp.pillar });
    revalidatePath("/qse/bonnes-pratiques");
    revalidatePath("/qse");
    return { success: true };
  } catch (err) {
    console.error("createBonnePratique exception:", err);
    return { success: false, error: "Erreur inattendue lors de l'enregistrement" };
  }
}

export async function deleteBonnePratique(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await supabase
    .from("bonnes_pratiques")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "delete", "best_practice", id, {});
  revalidatePath("/qse/bonnes-pratiques");
  revalidatePath("/qse");
  return { success: true };
}

export async function uploadBonnePratiquePhoto(
  formData: FormData
): Promise<{ filePath?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Aucun fichier fourni" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `qse/bonnes-pratiques/${Date.now()}-${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) return { error: error.message };
  return { filePath };
}
