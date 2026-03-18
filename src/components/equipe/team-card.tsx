"use client";

import { useState } from "react";
import { UserPlus, Crown, Pencil, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { addTeamMember, removeTeamMember, deleteTeam } from "@/actions/teams";
import type { Profile, TeamWithMembers, TeamMemberRole } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import TeamFormModal from "./team-form-modal";

interface TeamCardProps {
  team: TeamWithMembers;
  isAdmin: boolean;
  allUsers: Profile[];
  onRefresh: () => void;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export default function TeamCard({ team, isAdmin, allUsers, onRefresh }: TeamCardProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const manager = team.members.find((m) => m.role === "manager");
  const members = team.members.filter((m) => m.role === "member");
  const displayMembers = members.slice(0, 5);
  const extraCount = members.length - 5;

  // Users not in this team
  const availableUsers = allUsers.filter(
    (u) => u.is_active && !team.members.some((m) => m.user_id === u.id)
  );

  async function handleAddMember(userId: string, role: TeamMemberRole = "member") {
    setAddingMember(true);
    const result = await addTeamMember(team.id, userId, role);
    if (result.success) {
      toast.success("Membre ajouté");
      setShowAddMember(false);
      onRefresh();
    } else {
      toast.error(result.error || "Erreur lors de l'ajout");
    }
    setAddingMember(false);
  }

  async function handleRemoveMember() {
    if (!confirmRemove) return;
    setLoading(true);
    const result = await removeTeamMember(team.id, confirmRemove.userId);
    if (result.success) {
      toast.success("Membre retiré");
      onRefresh();
    } else {
      toast.error(result.error || "Erreur lors du retrait");
    }
    setConfirmRemove(null);
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteTeam(team.id);
    if (result.success) {
      toast.success("Équipe supprimée");
      onRefresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
    setConfirmDelete(false);
    setLoading(false);
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border-1)] bg-[var(--card)] p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[var(--heading)]">
                {team.label}
              </h3>
              <Badge variant="blue" size="sm">
                {team.members.length} membre{team.members.length > 1 ? "s" : ""}
              </Badge>
            </div>
            {team.description && (
              <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                {team.description}
              </p>
            )}
          </div>

          {isAdmin && (
            <DropdownMenu
              items={[
                {
                  label: "Modifier",
                  icon: Pencil,
                  onClick: () => setEditOpen(true),
                },
                {
                  label: "Supprimer",
                  icon: Trash2,
                  onClick: () => setConfirmDelete(true),
                  variant: "danger",
                },
              ]}
            />
          )}
        </div>

        {/* Manager */}
        {manager && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-medium text-white">
              {getInitials(manager.profile.first_name, manager.profile.last_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium text-[var(--heading)]">
                  {manager.profile.first_name} {manager.profile.last_name}
                </span>
                <Badge variant="amber" size="sm">
                  <Crown className="h-2.5 w-2.5" />
                  Manager
                </Badge>
              </div>
              {manager.profile.job_title && (
                <p className="truncate text-[10px] text-[var(--text-muted)]">
                  {manager.profile.job_title}
                </p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() =>
                  setConfirmRemove({
                    userId: manager.user_id,
                    name: `${manager.profile.first_name} ${manager.profile.last_name}`,
                  })
                }
                className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-amber-100 hover:text-red-500"
                title="Retirer"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Members list */}
        {displayMembers.length > 0 ? (
          <div className="space-y-1.5">
            {displayMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--hover)]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[9px] font-medium text-white">
                  {getInitials(member.profile.first_name, member.profile.last_name)}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--text)]">
                  {member.profile.first_name} {member.profile.last_name}
                </span>
                {isAdmin && (
                  <button
                    onClick={() =>
                      setConfirmRemove({
                        userId: member.user_id,
                        name: `${member.profile.first_name} ${member.profile.last_name}`,
                      })
                    }
                    className="shrink-0 rounded p-0.5 text-[var(--text-muted)] opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 [div:hover>&]:opacity-100"
                    title="Retirer"
                  >
                    <UserMinus className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {extraCount > 0 && (
              <p className="px-2 text-[10px] text-[var(--text-muted)]">
                +{extraCount} autre{extraCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        ) : (
          !manager && (
            <p className="py-3 text-center text-xs text-[var(--text-muted)]">
              Aucun membre
            </p>
          )
        )}

        {/* Add member button */}
        {isAdmin && (
          <div className="mt-3 border-t border-[var(--border-1)] pt-3">
            {showAddMember ? (
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAddMember(e.target.value);
                  }}
                  disabled={addingMember}
                  className="w-full rounded-lg border border-[var(--border-1)] bg-white px-2.5 py-1.5 text-xs text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Sélectionner un collaborateur...
                  </option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                      {u.job_title ? ` — ${u.job_title}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-1)] py-1.5 text-[11px] text-[var(--text-muted)] transition-colors hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
              >
                <UserPlus className="h-3 w-3" />
                Ajouter un membre
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <TeamFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          onRefresh();
        }}
        team={team}
        allUsers={allUsers}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Supprimer l'équipe"
        message={`Êtes-vous sûr de vouloir supprimer l'équipe "${team.label}" ? Tous les membres seront retirés. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
      />

      {/* Remove member confirmation */}
      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveMember}
        title="Retirer le membre"
        message={`Êtes-vous sûr de vouloir retirer ${confirmRemove?.name ?? ""} de l'équipe "${team.label}" ?`}
        confirmLabel="Retirer"
        variant="warning"
        loading={loading}
      />
    </>
  );
}
