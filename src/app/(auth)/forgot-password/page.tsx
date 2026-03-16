"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Zap, Mail, ArrowLeft } from "lucide-react";
import { useAuthLogos } from "@/components/auth/auth-logo-provider";

export default function ForgotPasswordPage() {
  const logos = useAuthLogos();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "expired") {
      setError("Le lien a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.");
    }
  }, [searchParams]);

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
        Mot de passe oublié
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Saisissez votre email pour recevoir un lien de réinitialisation
      </p>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Si un compte existe avec cet email, vous recevrez un lien de
            réinitialisation dans quelques instants.
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
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
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  );
}
