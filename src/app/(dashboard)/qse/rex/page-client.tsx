"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import RexList from "@/components/qse/rex-list";
import RexForm from "@/components/qse/rex-form";

interface RexItem {
  id: string;
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  created_at: string;
  author?: { first_name: string; last_name: string } | null;
}

interface Props {
  rexList: RexItem[];
}

export default function RexPageClient({ rexList }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <RexList
        rexList={rexList}
        headerAction={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouveau REX
          </button>
        }
      />

      {showForm && (
        <RexForm
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
