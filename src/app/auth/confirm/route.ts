import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "recovery"
    | "email"
    | "signup"
    | "magiclink"
    | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Pour les recovery, rediriger vers la page de reset
      if (type === "recovery") {
        return NextResponse.redirect(
          new URL("/reset-password", request.url)
        );
      }
      return NextResponse.redirect(new URL(next, request.url));
    }

    // Token invalide ou expiré — rediriger vers forgot-password avec erreur
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL("/forgot-password?error=expired", request.url)
      );
    }
  }

  // En cas d'erreur, rediriger vers login
  return NextResponse.redirect(new URL("/login", request.url));
}
