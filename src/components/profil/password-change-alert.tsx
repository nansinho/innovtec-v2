"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export default function PasswordChangeAlert() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] w-full max-w-lg -translate-x-1/2 px-4 md:bottom-6">
      <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--yellow-border)] bg-[var(--yellow-surface)] px-5 py-3 shadow-lg">
        <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--yellow)]" />
        <div className="flex-1">
          <p className="text-[13px] font-medium text-[var(--heading)]">
            Changement de mot de passe requis
          </p>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Pour des raisons de sécurité, veuillez modifier votre mot de passe.
          </p>
        </div>
        <Link
          href="/profil"
          className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.98]"
        >
          Modifier
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-white/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
