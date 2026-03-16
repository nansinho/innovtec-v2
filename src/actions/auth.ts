"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function signIn(formData: {
  email: string;
  password: string;
}): Promise<{ error: string }> {
  const supabase = await createClient();

  // 1. Essai normal via GoTrue
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (!error) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  // 2. Fallback : vérifier le mot de passe via crypt() PostgreSQL
  //    (pour les utilisateurs créés par migration SQL)
  const supabaseAdmin = createAdminClient();

  const { data: userId } = await supabaseAdmin.rpc("verify_user_password", {
    p_email: formData.email,
    p_password: formData.password,
  });

  if (!userId) {
    return { error: "Email ou mot de passe incorrect" };
  }

  // 3. Mot de passe crypt() valide → générer un magic link pour connecter l'utilisateur
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: formData.email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    return { error: "Email ou mot de passe incorrect" };
  }

  // 4. Utiliser le token pour créer la session
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    return { error: "Email ou mot de passe incorrect" };
  }

  // 5. Corriger le mot de passe dans GoTrue pour les prochaines connexions
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: formData.password,
  });

  revalidatePath("/", "layout");
  redirect("/");
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
  department?: string;
  team?: string;
  agency?: string;
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
        department: formData.department ?? "",
        team: formData.team ?? "",
        agency: formData.agency ?? "",
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

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Veuillez saisir votre email" };
  }

  const supabaseAdmin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Générer un lien de recovery via l'admin API
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/reset-password`,
    },
  });

  if (error) {
    return { success: false, error: `Erreur génération lien: ${error.message}` };
  }

  if (!data?.properties?.hashed_token) {
    return { success: false, error: "Aucun token généré. Vérifiez que l'email existe." };
  }

  // Construire le lien de confirmation
  const resetLink = `${siteUrl}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`;

  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Erreur envoi email: ${msg}` };
  }

  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: "Impossible de mettre à jour le mot de passe : " + error.message };
  }

  return { success: true };
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
