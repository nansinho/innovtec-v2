"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BonnePratique } from "@/lib/types/database";
import { createNotificationForAll } from "@/actions/notifications";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Try insert with all fields (new columns included)
  // If new columns don't exist yet, fallback to base columns only
  const fullPayload = {
    title: bp.title,
    pillar: bp.pillar,
    category: bp.category,
    description: bp.description,
    chantier: bp.chantier,
    photos: bp.photos,
    cover_photo: bp.cover_photo || "",
    difficulty: bp.difficulty || "",
    priority: bp.priority || "",
    cost_impact: bp.cost_impact || "",
    environmental_impact: bp.environmental_impact || "",
    safety_impact: bp.safety_impact || "",
    source_file_url: bp.source_file_url || "",
    author_id: user.id,
  };

  let { error } = await supabase.from("bonnes_pratiques").insert(fullPayload);

  // Fallback: if insert fails (new columns may not exist), try with base columns only
  if (error) {
    const basePayload = {
      title: bp.title,
      pillar: bp.pillar,
      category: bp.category,
      description: bp.description,
      chantier: bp.chantier,
      photos: bp.photos,
      author_id: user.id,
    };
    const fallback = await supabase.from("bonnes_pratiques").insert(basePayload);
    error = fallback.error;
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

  revalidatePath("/qse/bonnes-pratiques");
  revalidatePath("/qse");
  return { success: true };
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
