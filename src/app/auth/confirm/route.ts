import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function getBaseUrl(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

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
  const baseUrl = getBaseUrl(request);

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
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", baseUrl));
      }
      return NextResponse.redirect(new URL(next, baseUrl));
    }

    // Token invalide ou expiré
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL("/forgot-password?error=expired", baseUrl)
      );
    }
  }

  return NextResponse.redirect(new URL("/login", baseUrl));
}
