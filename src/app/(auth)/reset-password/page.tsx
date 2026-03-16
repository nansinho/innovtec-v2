"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePasswordWithToken } from "@/actions/auth";
import { Zap, Lock, AlertTriangle } from "lucide-react";
import { useAuthLogos } from "@/components/auth/auth-logo-provider";
import Link from "next/link";

export default function ResetPasswordPage() {
  const logos = useAuthLogos();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Pas de token → lien invalide
  if (!token) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          Lien invalide
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    const result = await updatePasswordWithToken(token!, password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
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
        Nouveau mot de passe
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Choisissez votre nouveau mot de passe
      </p>

      {success ? (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Mot de passe mis à jour ! Redirection vers la connexion...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-900"
            >
              Nouveau mot de passe
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-gray-900"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>
      )}
    </div>
  );
}
