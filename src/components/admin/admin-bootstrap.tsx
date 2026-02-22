"use client";

import { useState, useTransition } from "react";
import { Shield, AlertCircle } from "lucide-react";
import { promoteToAdmin } from "@/actions/users";

export default function AdminBootstrap() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handlePromote() {
    startTransition(async () => {
      const result = await promoteToAdmin();
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error || "Erreur");
      }
    });
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--yellow-surface)]">
        <AlertCircle className="h-8 w-8 text-[var(--yellow)]" />
      </div>
      <h1 className="mb-2 text-xl font-semibold text-[var(--heading)]">
        Aucun administrateur configuré
      </h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Il n&apos;y a actuellement aucun administrateur dans le système. Vous pouvez vous définir comme administrateur pour accéder à toutes les fonctionnalités.
      </p>

      <button
        onClick={handlePromote}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--yellow-hover)] disabled:opacity-50"
      >
        <Shield className="h-4 w-4" />
        {isPending ? "Configuration..." : "Devenir administrateur"}
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
