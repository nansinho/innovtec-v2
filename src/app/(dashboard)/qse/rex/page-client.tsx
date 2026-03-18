"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import RexList from "@/components/qse/rex-list";
import RexForm from "@/components/qse/rex-form";
import type { Rex } from "@/lib/types/database";
import type { RexAuthorOption } from "@/components/qse/rex-form";

interface RexItem extends Rex {
  author?: { first_name: string; last_name: string } | null;
}

interface Props {
  rexList: RexItem[];
  profiles?: RexAuthorOption[];
}

export default function RexPageClient({ rexList, profiles = [] }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <RexList
        rexList={rexList}
        headerAction={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Nouveau REX
          </Button>
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
          profiles={profiles}
        />
      )}
    </div>
  );
}
