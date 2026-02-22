"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signUp(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, password, firstName, lastName } = formData;

  if (!email || !password || !firstName || !lastName) {
    return { success: false, error: "Tous les champs sont obligatoires" };
  }

  if (password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  try {
    const supabaseAdmin = createAdminClient();

    // Create auth user via admin API (bypasses client-side crypto issues)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        return { success: false, error: "Un compte existe déjà avec cet email" };
      }
      return { success: false, error: "Erreur lors de la création du compte : " + authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Erreur inattendue lors de la création du compte" };
    }

    // Manually insert profile (in case the trigger doesn't exist or fails)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      }, { onConflict: "id" });

    if (profileError) {
      // Profile creation failed but auth user exists — log but don't block
      console.error("Profile creation error (non-blocking):", profileError.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "Erreur serveur lors de la création du compte. Vérifiez la configuration.",
    };
  }
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
