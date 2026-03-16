"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp, signIn } from "@/actions/auth";
import { Zap, Mail, Lock, User } from "lucide-react";
import { useAuthLogos } from "@/components/auth/auth-logo-provider";

export default function SignupPage() {
  const logos = useAuthLogos();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create user via server action (admin API)
      const result = await signUp({ email, password, firstName, lastName });

      if (!result.success) {
        setError(result.error || "Erreur lors de la création du compte");
        setLoading(false);
        return;
      }

      // Sign in the newly created user via server action
      const signInResult = await signIn({ email, password });
      if (signInResult?.error) {
        setError("Compte créé mais connexion échouée. Essayez de vous connecter.");
        setLoading(false);
      }
    } catch (err) {
      // Next.js redirect() throws a special error — let it propagate
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
      setError("Compte créé mais impossible de se connecter automatiquement. Essayez de vous connecter.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo - visible only on mobile */}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600">
              <Zap className="h-5 w-5 text-gray-900" />
            </div>
            <div className="text-base font-bold tracking-tight text-gray-900">
              INNOVTEC{" "}
              <span className="font-normal text-gray-400">Réseaux</span>
            </div>
          </>
        )}
      </div>

      <h1 className="mb-1.5 text-2xl font-bold text-gray-900">
        Créer un compte
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Inscrivez-vous pour accéder à l&apos;intranet
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1.5 block text-sm font-medium text-gray-900"
            >
              Prénom
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                required
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="mb-1.5 block text-sm font-medium text-gray-900"
            >
              Nom
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                required
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-900"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@innovtec-reseaux.fr"
              required
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-900"
          >
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-orange-600 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-semibold text-gray-900 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
