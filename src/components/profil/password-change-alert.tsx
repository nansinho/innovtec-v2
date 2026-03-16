"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export default function PasswordChangeAlert() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] w-full max-w-lg -translate-x-1/2 px-4 md:bottom-6">
      <div className="flex items-center gap-3 rounded-xl border border-orange-500 bg-orange-50 px-5 py-3 shadow-lg">
        <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
        <div className="flex-1">
          <p className="text-[13px] font-medium text-gray-900">
            Changement de mot de passe requis
          </p>
          <p className="text-[11px] text-gray-500">
            Pour des raisons de sécurité, veuillez modifier votre mot de passe.
          </p>
        </div>
        <Link
          href="/profil"
          className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-orange-700"
        >
          Modifier
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
