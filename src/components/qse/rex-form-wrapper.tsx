"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import RexForm from "./rex-form";

export default function RexFormWrapper() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
        >
          <Plus className="h-4 w-4" />
          Nouveau REX
        </button>
      ) : (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--heading)]"
            >
              <X className="h-3.5 w-3.5" />
              Fermer
            </button>
          </div>
          <RexForm
            onCreated={() => {
              setShowForm(false);
              window.location.reload();
            }}
          />
        </div>
      )}
    </div>
  );
}
