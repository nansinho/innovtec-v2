"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/actions/auth";
import { Zap, Mail, Lock } from "lucide-react";
import { useAuthLogos } from "@/components/auth/auth-logo-provider";

export default function LoginPage() {
  const logos = useAuthLogos();
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
        Connexion
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Accédez à votre espace intranet
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
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
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-semibold text-gray-900 hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
