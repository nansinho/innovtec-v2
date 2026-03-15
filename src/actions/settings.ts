"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getApiSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rh"].includes(profile.role)) return null;

  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("key", "anthropic_api_key")
    .single();

  return data
    ? { hasKey: true, maskedKey: maskApiKey(data.value) }
    : { hasKey: false, maskedKey: "" };
}

export async function saveApiKey(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    return { success: false, error: "Accès non autorisé" };
  }

  if (!apiKey.trim()) {
    return { success: false, error: "La clé API est requise" };
  }

  const admin = createAdminClient();

  const { error } = await admin.from("app_settings").upsert(
    {
      key: "anthropic_api_key",
      value: apiKey.trim(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("Error saving API key:", error);
    return { success: false, error: "Erreur lors de la sauvegarde" };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function deleteApiKey(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    return { success: false, error: "Accès non autorisé" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .delete()
    .eq("key", "anthropic_api_key");

  if (error) {
    console.error("Error deleting API key:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function getAnthropicApiKey(): Promise<string | null> {
  // First check app_settings in database
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "anthropic_api_key")
      .single();

    if (data?.value) return data.value;
  } catch {
    // Table might not exist yet, fall through to env
  }

  // Fallback to environment variable
  return process.env.ANTHROPIC_API_KEY || null;
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return "••••••••";
  return key.slice(0, 7) + "••••••••" + key.slice(-4);
}

// ── Company Logo (light / dark variants) ──

export type CompanyLogos = { light: string | null; dark: string | null };

export async function getCompanyLogo(): Promise<CompanyLogos> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("app_settings")
      .select("key, value")
      .in("key", ["company_logo_light", "company_logo_dark"]);

    const map: Record<string, string> = {};
    for (const row of data || []) map[row.key] = row.value;

    return {
      light: map["company_logo_light"] || null,
      dark: map["company_logo_dark"] || null,
    };
  } catch {
    return { light: null, dark: null };
  }
}

export async function saveCompanyLogo(
  url: string,
  variant: "light" | "dark"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    return { success: false, error: "Accès non autorisé" };
  }

  if (!url.trim()) {
    return { success: false, error: "L'URL du logo est requise" };
  }

  const admin = createAdminClient();
  const key = variant === "dark" ? "company_logo_dark" : "company_logo_light";

  const { error } = await admin.from("app_settings").upsert(
    {
      key,
      value: url.trim(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("Error saving company logo:", error);
    return { success: false, error: "Erreur lors de la sauvegarde" };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteCompanyLogo(
  variant: "light" | "dark"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rh"].includes(profile.role)) {
    return { success: false, error: "Accès non autorisé" };
  }

  const admin = createAdminClient();
  const key = variant === "dark" ? "company_logo_dark" : "company_logo_light";

  // Get current logo URL to delete from storage
  const { data: current } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (current?.value) {
    try {
      const fileUrl = new URL(current.value);
      const pathMatch = fileUrl.pathname.match(/\/company-logos\/(.+)$/);
      if (pathMatch) {
        await admin.storage.from("company-logos").remove([pathMatch[1]]);
      }
    } catch {
      // Ignore storage deletion errors
    }
  }

  const { error } = await admin
    .from("app_settings")
    .delete()
    .eq("key", key);

  if (error) {
    console.error("Error deleting company logo:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
