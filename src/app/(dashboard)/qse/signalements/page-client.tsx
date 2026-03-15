"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, List, User } from "lucide-react";
import { cn } from "@/lib/utils";
import SignalementForm from "@/components/qse/signalement-form";
import SignalementList from "@/components/qse/signalement-list";
import MesSignalements from "@/components/qse/mes-signalements";
import type { DangerReport, SignalementCategory } from "@/lib/types/database";

interface Props {
  signalements: DangerReport[];
  categories: SignalementCategory[];
  mySignalements: DangerReport[];
  canManage: boolean;
}

export default function SignalementPageClient({
  signalements,
  categories,
  mySignalements,
  canManage,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"all" | "mine">(canManage ? "all" : "mine");
  const router = useRouter();

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--heading)]">
            Signalements
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Signalez et suivez les situations dangereuses identifiées.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Nouveau signalement
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] p-1">
        {canManage && (
          <button
            onClick={() => setTab("all")}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-xs)] px-4 py-2 text-sm font-medium transition-all",
              tab === "all"
                ? "bg-[var(--card)] text-[var(--heading)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--heading)]"
            )}
          >
            <List className="h-4 w-4" />
            Tous les signalements
            <span className="ml-1 rounded-full bg-[var(--yellow-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--yellow)]">
              {signalements.length}
            </span>
          </button>
        )}
        <button
          onClick={() => setTab("mine")}
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-xs)] px-4 py-2 text-sm font-medium transition-all",
            tab === "mine"
              ? "bg-[var(--card)] text-[var(--heading)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--heading)]"
          )}
        >
          <User className="h-4 w-4" />
          Mes signalements
          <span className="ml-1 rounded-full bg-[var(--blue-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--blue)]">
            {mySignalements.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {tab === "all" && canManage ? (
        <SignalementList
          signalements={signalements}
          categories={categories}
          canManage={canManage}
        />
      ) : (
        <MesSignalements signalements={mySignalements} />
      )}

      {/* Form modal */}
      {showForm && (
        <SignalementForm
          categories={categories}
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
