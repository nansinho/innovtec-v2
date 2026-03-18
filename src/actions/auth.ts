"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHmac } from "crypto";
import { auditLog } from "@/lib/audit-logger";
import { checkRateLimit } from "@/lib/rate-limit";

export async function signOut() {
  const supabase = await createClient();
  const { data: { user: signOutUser } } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (signOutUser) await auditLog(signOutUser.id, "logout", "user", signOutUser.id, {});
  revalidatePath("/", "layout");
}

export async function signIn(formData: {
  email: string;
  password: string;
}): Promise<{ error: string }> {
  // Rate limit: 10 attempts per minute per email
  const { success: rateLimitOk } = checkRateLimit(
    `signIn:${formData.email.toLowerCase()}`,
    10,
    60_000
  );
  if (!rateLimitOk) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const supabase = await createClient();

  // 1. Essai normal via GoTrue
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (!error) {
    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    if (signedInUser) await auditLog(signedInUser.id, "login", "user", signedInUser.id, { method: "password" });
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

  const { data: { user: signedInUser } } = await supabase.auth.getUser();
  if (signedInUser) await auditLog(signedInUser.id, "login", "user", signedInUser.id, { method: "password" });
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

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return {
      success: false,
      error:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
    };
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
        is_active: true,
      }, { onConflict: "id" });

    if (profileError) {
      // Profile creation failed but auth user exists — log but don't block
      console.error("Profile creation error (non-blocking):", profileError.message);
    }

    await auditLog(authData.user.id, "create", "user", authData.user.id, { email, self_signup: true });
    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "Erreur serveur lors de la création du compte. Vérifiez la configuration.",
    };
  }
}

// ==========================================
// PASSWORD RESET (custom, sans GoTrue)
// ==========================================

function getResetSecret(): string {
  const secret = process.env.PASSWORD_RESET_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("PASSWORD_RESET_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  return secret;
}
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 heure

function generateResetToken(userId: string): string {
  const expiry = Date.now() + RESET_EXPIRY_MS;
  const payload = `${userId}:${expiry}`;
  const signature = createHmac("sha256", getResetSecret())
    .update(payload)
    .digest("hex");
  // Encode en base64url pour passer dans une URL
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function verifyResetToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [userId, expiryStr, signature] = parts;
    const expiry = Number(expiryStr);

    // Vérifier expiration
    if (Date.now() > expiry) return null;

    // Vérifier signature
    const expectedSig = createHmac("sha256", getResetSecret())
      .update(`${userId}:${expiryStr}`)
      .digest("hex");

    if (signature !== expectedSig) return null;

    return { userId };
  } catch {
    return null;
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Veuillez saisir votre email" };
  }

  // Rate limit: 3 attempts per minute per email
  const { success: rateLimitOk } = checkRateLimit(
    `passwordReset:${email.toLowerCase()}`,
    3,
    60_000
  );
  if (!rateLimitOk) {
    return { success: false, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const supabaseAdmin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Vérifier que l'utilisateur existe dans profiles
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    // Ne pas révéler si l'email existe ou non
    return { success: true };
  }

  // Générer un token signé custom (bypass GoTrue)
  const token = generateResetToken(profile.id);
  const resetLink = `${siteUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Erreur envoi email: ${msg}` };
  }

  return { success: true };
}

export async function updatePasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (
    !newPassword ||
    newPassword.length < 8 ||
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword) ||
    !/[^A-Za-z0-9]/.test(newPassword)
  ) {
    return {
      success: false,
      error:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
    };
  }

  const result = verifyResetToken(token);
  if (!result) {
    return { success: false, error: "Lien expiré ou invalide. Veuillez en demander un nouveau." };
  }

  // Mettre à jour le mot de passe via admin API
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(result.userId, {
    password: newPassword,
  });

  if (error) {
    return { success: false, error: "Impossible de mettre à jour le mot de passe : " + error.message };
  }

  await auditLog(result.userId, "password_reset", "user", result.userId, {});
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
