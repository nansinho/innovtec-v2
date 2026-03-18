"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, UsersRound } from "lucide-react";
import type { Profile, TeamWithMembers } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import TeamCard from "./team-card";
import TeamFormModal from "./team-form-modal";

interface TeamsManagerProps {
  teams: TeamWithMembers[];
  allUsers: Profile[];
  isAdmin: boolean;
}

export default function TeamsManager({ teams, allUsers, isAdmin }: TeamsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = teams.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher une équipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-[var(--border-1)] bg-white pl-9 pr-7 text-xs text-[var(--heading)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
          />
        </div>

        {isAdmin && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Créer une équipe
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-2 text-[11px] text-[var(--text-muted)]">
        <span>
          {filtered.length} équipe{filtered.length > 1 ? "s" : ""}
        </span>
        {search && <span>pour &laquo; {search} &raquo;</span>}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isAdmin={isAdmin}
              allUsers={allUsers}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title="Aucune équipe"
          description={
            search
              ? "Aucune équipe ne correspond à votre recherche."
              : "Commencez par créer votre première équipe."
          }
          action={
            isAdmin && !search ? (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Créer une équipe
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Create modal */}
      <TeamFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          handleRefresh();
        }}
        allUsers={allUsers}
      />
    </div>
  );
}
