"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";
import { Zap, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn({ email, password });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      // Next.js redirect() throws a special error — let it propagate
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo - visible only on mobile */}
      <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--yellow)]">
          <Zap className="h-5 w-5 text-[var(--navy)]" />
        </div>
        <div className="text-base font-bold tracking-tight text-[var(--heading)]">
          INNOVTEC{" "}
          <span className="font-normal text-[var(--text-muted)]">Réseaux</span>
        </div>
      </div>

      <h1 className="mb-1.5 text-2xl font-bold text-[var(--heading)]">
        Connexion
      </h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Accédez à votre espace intranet
      </p>

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

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--heading)]"
          >
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--navy)] hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
