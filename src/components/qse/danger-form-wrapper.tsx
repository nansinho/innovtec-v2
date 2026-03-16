"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import DangerForm from "./danger-form";

export default function DangerFormWrapper() {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Signaler une situation
        </button>
      ) : (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-900"
            >
              <X className="h-3.5 w-3.5" />
              Fermer
            </button>
          </div>
          <DangerForm
            onCreated={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
