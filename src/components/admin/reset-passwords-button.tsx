"use client";

import { useState } from "react";
import { resetAllCollaboratorPasswords } from "@/actions/users";
import { KeyRound } from "lucide-react";

export default function ResetPasswordsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: number;
    failed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!confirm("Réinitialiser le mot de passe de TOUS les collaborateurs à Innovtec2025! ?")) return;
    setLoading(true);
    setError("");
    setResult(null);

    const res = await resetAllCollaboratorPasswords();

    if (!res.success) {
      setError(res.error ?? "Erreur inconnue");
    } else {
      setResult({ ok: res.ok, failed: res.failed, total: res.total });
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-5">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
        <KeyRound className="h-4 w-4" />
        Mots de passe collaborateurs
      </div>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Réinitialiser le mot de passe de tous les collaborateurs à <strong>Innovtec2025!</strong>
      </p>

      <button
        onClick={handleReset}
        disabled={loading}
        className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Réinitialisation en cours..." : "Réinitialiser tous les mots de passe"}
      </button>

      {result && (
        <p className="mt-3 text-sm text-green-600">
          Terminé : {result.ok}/{result.total} réussis{result.failed > 0 ? `, ${result.failed} échoué(s)` : ""}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
