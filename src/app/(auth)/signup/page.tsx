"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Zap } from "lucide-react";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-8">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--yellow)]">
            <Zap className="h-4 w-4 text-[var(--navy)]" />
          </div>
          <div className="text-sm font-semibold tracking-tight text-[var(--heading)]">
            INNOVTEC{" "}
            <span className="font-normal text-[var(--text-muted)]">
              Réseaux
            </span>
          </div>
        </div>

        <h1 className="mb-1 text-center text-lg font-semibold text-[var(--heading)]">
          Créer un compte
        </h1>
        <p className="mb-6 text-center text-xs text-[var(--text-secondary)]">
          Inscrivez-vous pour accéder à l&apos;intranet
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                required
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                required
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@innovtec-reseaux.fr"
              required
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--red)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--text-secondary)]">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--yellow)] hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
