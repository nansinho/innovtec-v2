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

function SignalementTabs({
  tab,
  onTabChange,
  canManage,
  allCount,
  mineCount,
}: {
  tab: "all" | "mine";
  onTabChange: (t: "all" | "mine") => void;
  canManage: boolean;
  allCount: number;
  mineCount: number;
}) {
  return (
    <div className="mb-3 flex gap-0 border-b border-[var(--border-1)]">
      {canManage && (
        <button
          onClick={() => onTabChange("all")}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            tab === "all"
              ? "text-[var(--heading)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <List className="h-3.5 w-3.5" />
          Tous les signalements
          <span className={cn(
            "ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold",
            tab === "all"
              ? "bg-[var(--yellow)] text-white"
              : "bg-zinc-100 text-zinc-500"
          )}>
            {allCount}
          </span>
          {tab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--yellow)]" />
          )}
        </button>
      )}
      <button
        onClick={() => onTabChange("mine")}
        className={cn(
          "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
          tab === "mine"
            ? "text-[var(--heading)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
      >
        <User className="h-3.5 w-3.5" />
        Mes signalements
        <span className={cn(
          "ml-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold",
          tab === "mine"
            ? "bg-[var(--navy)] text-white"
            : "bg-zinc-100 text-zinc-500"
        )}>
          {mineCount}
        </span>
        {tab === "mine" && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--yellow)]" />
        )}
      </button>
    </div>
  );
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

  const tabs = (
    <SignalementTabs
      tab={tab}
      onTabChange={setTab}
      canManage={canManage}
      allCount={signalements.length}
      mineCount={mySignalements.length}
    />
  );

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Content */}
      {tab === "all" && canManage ? (
        <SignalementList
          signalements={signalements}
          categories={categories}
          canManage={canManage}
          onAdd={() => setShowForm(true)}
          tabsSlot={tabs}
        />
      ) : (
        <>
          {tabs}
          <MesSignalements signalements={mySignalements} />
        </>
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
