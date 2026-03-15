"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      <ActionPlanList
        plans={plans}
        canManage={canManage}
        onEdit={(plan) => setFormModal({ open: true, plan })}
        onAdd={canManage ? () => setFormModal({ open: true }) : undefined}
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
