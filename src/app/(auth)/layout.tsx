
import { Zap, Shield, Users, Newspaper } from "lucide-react";
import { getCompanyLogo } from "@/actions/settings";
import { AuthLogoProvider } from "@/components/auth/auth-logo-provider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logos = await getCompanyLogo();

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel - hidden on mobile */}
      <div className="relative hidden overflow-hidden bg-[var(--navy)] lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative geometric shapes */}
        <div
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full"
          style={{ background: "rgba(245, 166, 35, 0.06)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full"
          style={{ background: "rgba(255, 255, 255, 0.03)" }}
        />
        <div
          className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full"
          style={{ background: "rgba(255, 255, 255, 0.02)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 h-32 w-32 rotate-45 rounded-2xl"
          style={{ background: "rgba(245, 166, 35, 0.04)" }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-16 flex items-center gap-3">
            {(logos.dark || logos.light) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={(logos.dark || logos.light)!}
                alt="Logo société"
                className="h-12 max-w-[200px] object-contain"
              />
            ) : (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--yellow)]">
                  <Zap className="h-5 w-5 text-[var(--navy)]" />
                </div>
                <div className="text-lg font-bold tracking-tight text-white">
                  INNOVTEC{" "}
                  <span className="font-normal text-white/50">Réseaux</span>
                </div>
              </>
            )}
          </div>

          {/* Welcome message */}
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white">
            Votre espace de travail
            <br />
            <span className="text-[var(--yellow)]">collaboratif</span>
          </h1>
          <p className="mb-10 max-w-sm text-sm leading-relaxed text-white/60">
            Retrouvez tous vos outils et informations au même endroit pour
            travailler efficacement au quotidien.
          </p>

          {/* Features list */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.07]">
                <Users className="h-4 w-4 text-[var(--yellow)]" />
              </div>
              <span className="text-sm text-white/70">
                Gestion de profil et documents
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.07]">
                <Shield className="h-4 w-4 text-[var(--yellow)]" />
              </div>
              <span className="text-sm text-white/70">
                Suivi QSE et sécurité
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.07]">
                <Newspaper className="h-4 w-4 text-[var(--yellow)]" />
              </div>
              <span className="text-sm text-white/70">
                Actualités de l&apos;entreprise
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-white/30">
          © 2026 INNOVTEC Réseaux — Tous droits réservés
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-[var(--card)] p-6 sm:p-8">
        <AuthLogoProvider logos={logos}>
          {children}
        </AuthLogoProvider>
      </div>
    </div>
  );
}
