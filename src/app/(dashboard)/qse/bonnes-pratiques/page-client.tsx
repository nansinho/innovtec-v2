"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle bonne pratique
          </Button>
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
