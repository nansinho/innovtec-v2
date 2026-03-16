"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, User } from "lucide-react";
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
                ? "bg-[var(--yellow)] text-white"
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
              ? "bg-[var(--navy)] text-white"
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
          onAdd={() => setShowForm(true)}
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
