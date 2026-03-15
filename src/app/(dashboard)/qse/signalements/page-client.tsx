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
      <div className="mb-6 flex gap-0 border-b border-[var(--border-1)]">
        {canManage && (
          <button
            onClick={() => setTab("all")}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "all"
                ? "text-[var(--heading)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <List className="h-4 w-4" />
            Tous les signalements
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              tab === "all"
                ? "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-500"
            )}>
              {signalements.length}
            </span>
            {tab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--yellow)]" />
            )}
          </button>
        )}
        <button
          onClick={() => setTab("mine")}
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
            tab === "mine"
              ? "text-[var(--heading)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <User className="h-4 w-4" />
          Mes signalements
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tab === "mine"
              ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm"
              : "bg-zinc-100 text-zinc-500"
          )}>
            {mySignalements.length}
          </span>
          {tab === "mine" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--yellow)]" />
          )}
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
