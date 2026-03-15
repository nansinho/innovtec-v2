"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ActionPlanList from "@/components/qse/action-plan-list";
import ActionPlanForm from "@/components/qse/action-plan-form";
import type { ActionPlan, DangerReport, Profile, SignalementPriority } from "@/lib/types/database";

interface Props {
  plans: ActionPlan[];
  canManage: boolean;
  profiles: Pick<Profile, "id" | "first_name" | "last_name">[];
  unresolvedSignalements: Pick<DangerReport, "id" | "title" | "priority">[];
}

export default function PlansPageClient({
  plans,
  canManage,
  profiles,
  unresolvedSignalements,
}: Props) {
  const [formModal, setFormModal] = useState<{ open: boolean; plan?: ActionPlan }>({
    open: false,
  });
  const router = useRouter();

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--heading)]">
            Plans d&apos;actions
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Gérez les plans d&apos;actions correctives et préventives.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setFormModal({ open: true })}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouveau plan
          </button>
        )}
      </div>

      <ActionPlanList
        plans={plans}
        canManage={canManage}
        onEdit={(plan) => setFormModal({ open: true, plan })}
      />

      {formModal.open && (
        <ActionPlanForm
          plan={formModal.plan}
          profiles={profiles}
          unresolvedSignalements={unresolvedSignalements}
          onSaved={() => {
            setFormModal({ open: false });
            router.refresh();
          }}
          onClose={() => setFormModal({ open: false })}
        />
      )}
    </div>
  );
}
