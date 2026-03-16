"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import RexList from "@/components/qse/rex-list";
import RexForm from "@/components/qse/rex-form";
import type { Rex } from "@/lib/types/database";

interface RexItem extends Rex {
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
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau REX
          </button>
        }
      />

      {showForm && (
        <RexForm
          onCreated={(id) => {
            setShowForm(false);
            if (id) {
              router.push(`/qse/rex/${id}`);
            }
            router.refresh();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
