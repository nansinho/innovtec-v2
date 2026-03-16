"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Zap, Mail, ArrowLeft } from "lucide-react";
import { useAuthLogos } from "@/components/auth/auth-logo-provider";

export default function ForgotPasswordPage() {
  const logos = useAuthLogos();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await requestPasswordReset(email);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error ?? "Une erreur est survenue");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo mobile */}
      <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
        {(logos.light || logos.dark) ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={(logos.light || logos.dark)!}
            alt="Logo société"
            className="h-10 max-w-[180px] object-contain"
          />
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--yellow)]">
              <Zap className="h-5 w-5 text-[var(--navy)]" />
            </div>
            <div className="text-base font-bold tracking-tight text-[var(--heading)]">
              INNOVTEC{" "}
              <span className="font-normal text-[var(--text-muted)]">Réseaux</span>
            </div>
          </>
        )}
      </div>

      <h1 className="mb-1.5 text-2xl font-bold text-[var(--heading)]">
        Mot de passe oublié
      </h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Saisissez votre email pour recevoir un lien de réinitialisation
      </p>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-sm)] bg-green-50 px-4 py-3 text-sm text-green-700">
            Si un compte existe avec cet email, vous recevrez un lien de
            réinitialisation dans quelques instants.
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--navy)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--heading)]"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@innovtec-reseaux.fr"
                required
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] py-3 pl-11 pr-4 text-sm text-[var(--heading)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-[var(--radius-xs)] bg-[var(--red-surface)] px-3.5 py-2.5 text-sm text-[var(--red)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-[var(--radius-sm)] bg-[var(--yellow)] py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-[var(--yellow-hover)] hover:shadow-md active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--navy)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  );
}
