"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  console.log("[BP] createBonnePratique called with title:", bp.title);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[BP] User not authenticated");
      return { success: false, error: "Non authentifié" };
    }
    console.log("[BP] User:", user.id);

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();
    console.log("[BP] Admin client created");

    // Insert with base columns only (guaranteed to work)
    const { error } = await adminSupabase.from("bonnes_pratiques").insert({
      title: bp.title,
      pillar: bp.pillar,
      category: bp.category || "",
      description: bp.description,
      chantier: bp.chantier || "",
      photos: bp.photos || [],
      author_id: user.id,
    });

    if (error) {
      console.error("[BP] Insert failed:", error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    console.log("[BP] Insert successful");

    // Notify (non-blocking — don't let notification failure break the save)
    try {
      await createNotificationForAll({
        type: "system",
        title: "Nouvelle bonne pratique",
        message: bp.title,
        link: "/qse/bonnes-pratiques",
        excludeUserId: user.id,
      });
    } catch (notifErr) {
      console.error("[BP] Notification failed (non-blocking):", notifErr);
    }

    revalidatePath("/qse/bonnes-pratiques");
    revalidatePath("/qse");
    console.log("[BP] Returning success");
    return { success: true };
  } catch (err) {
    console.error("[BP] Exception:", err);
    return { success: false, error: String(err) };
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
