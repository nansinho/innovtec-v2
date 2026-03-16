"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import BonnesPratiquesList from "@/components/qse/bonnes-pratiques-list";
import BonnePratiqueForm from "@/components/qse/bonne-pratique-form";
import type { BonnePratique } from "@/lib/types/database";

interface Props {
  items: BonnePratique[];
}

export default function BonnesPratiquesPageClient({ items }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <BonnesPratiquesList
        items={items}
        headerAction={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--green)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle bonne pratique
          </button>
        }
      />

      {showForm && (
        <BonnePratiqueForm
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
