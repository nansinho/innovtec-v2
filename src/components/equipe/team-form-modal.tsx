"use client";

import { useState, useEffect } from "react";
import { X, UsersRound, Pencil, Crown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
} from "@/actions/teams";
import type { Profile, TeamWithMembers } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

interface TeamFormModalProps {
  open: boolean;
  onClose: () => void;
  team?: TeamWithMembers;
  allUsers: Profile[];
}

export default function TeamFormModal({
  open,
  onClose,
  team,
  allUsers,
}: TeamFormModalProps) {
  const isEdit = !!team;
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    if (team) {
      setLabel(team.label);
      setDescription(team.description ?? "");
      const mgr = team.members.find((m) => m.role === "manager");
      setManagerId(mgr?.user_id ?? "");
      setSelectedMembers(
        new Set(team.members.filter((m) => m.role === "member").map((m) => m.user_id))
      );
    } else {
      setLabel("");
      setDescription("");
      setManagerId("");
      setSelectedMembers(new Set());
    }
    setMemberSearch("");
  }, [team, open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose, loading]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggleMember(userId: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      // If user is selected as manager, don't add to members
      if (userId === managerId) {
        next.delete(userId);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    setLoading(true);

    try {
      let teamId = team?.id;

      if (isEdit && team) {
        // Update team info
        const updateResult = await updateTeam(team.id, {
          label: label.trim(),
          description: description.trim(),
        });
        if (!updateResult.success) {
          toast.error(updateResult.error || "Erreur lors de la modification");
          setLoading(false);
          return;
        }
      } else {
        // Create team
        const createResult = await createTeam(label.trim(), description.trim());
        if (!createResult.success || !createResult.team) {
          toast.error(createResult.error || "Erreur lors de la création");
          setLoading(false);
          return;
        }
        teamId = createResult.team.id;
      }

      if (!teamId) {
        setLoading(false);
        return;
      }

      // Sync members
      const currentMembers = team?.members ?? [];
      const currentMemberIds = new Set(currentMembers.map((m) => m.user_id));
      const currentManagerId = currentMembers.find((m) => m.role === "manager")?.user_id;

      // Desired state
      const desiredMemberIds = new Set(selectedMembers);
      const desiredManagerId = managerId || null;

      // All desired user IDs (manager + members)
      const allDesiredIds = new Set(desiredMemberIds);
      if (desiredManagerId) allDesiredIds.add(desiredManagerId);

      // Remove members no longer in team
      for (const member of currentMembers) {
        if (!allDesiredIds.has(member.user_id)) {
          await removeTeamMember(teamId, member.user_id);
        }
      }

      // Add new manager
      if (desiredManagerId && desiredManagerId !== currentManagerId) {
        await addTeamMember(teamId, desiredManagerId, "manager");
      } else if (!desiredManagerId && currentManagerId) {
        // If manager was removed, either remove them or demote them
        if (!desiredMemberIds.has(currentManagerId)) {
          await removeTeamMember(teamId, currentManagerId);
        } else {
          await addTeamMember(teamId, currentManagerId, "member");
        }
      }

      // Add/update members
      for (const userId of desiredMemberIds) {
        if (userId === desiredManagerId) continue; // Already handled as manager
        if (!currentMemberIds.has(userId)) {
          await addTeamMember(teamId, userId, "member");
        } else {
          // Check if role changed (was manager, now member)
          const currentMember = currentMembers.find((m) => m.user_id === userId);
          if (currentMember && currentMember.role !== "member") {
            await addTeamMember(teamId, userId, "member");
          }
        }
      }

      toast.success(isEdit ? "Équipe modifiée" : "Équipe créée");
      onClose();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const activeUsers = allUsers.filter((u) => u.is_active);
  const filteredUsers = activeUsers.filter((u) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const inputClass =
    "w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";
  const selectClass =
    "w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-[560px] max-h-[90vh] animate-scale-in overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/[0.04]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--yellow-surface)]">
              {isEdit ? (
                <Pencil className="h-4 w-4 text-[var(--yellow)]" />
              ) : (
                <UsersRound className="h-4 w-4 text-[var(--yellow)]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--heading)]">
                {isEdit ? "Modifier l'équipe" : "Nouvelle équipe"}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isEdit
                  ? "Modifiez les informations de l'équipe"
                  : "Créez une nouvelle équipe et ajoutez des membres"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--heading)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5 p-6">
            {/* Nom */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Nom de l&apos;équipe *
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Équipe Fibre Sud"
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de l'équipe (optionnel)"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Manager */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                <Crown className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => {
                  const newManagerId = e.target.value;
                  setManagerId(newManagerId);
                  // Remove new manager from members if present
                  if (newManagerId) {
                    setSelectedMembers((prev) => {
                      const next = new Set(prev);
                      next.delete(newManagerId);
                      return next;
                    });
                  }
                }}
                className={selectClass}
              >
                <option value="">-- Aucun manager --</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                    {u.job_title ? ` — ${u.job_title}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Membres */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Membres ({selectedMembers.size} sélectionné{selectedMembers.size > 1 ? "s" : ""})
              </label>

              {/* Search */}
              <input
                type="text"
                placeholder="Rechercher un collaborateur..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className={`mb-2 ${inputClass}`}
              />

              {/* Checkbox list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border-1)] bg-[var(--bg)]">
                {filteredUsers
                  .filter((u) => u.id !== managerId)
                  .map((user) => {
                    const isSelected = selectedMembers.has(user.id);
                    return (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-[var(--hover)]"
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? "border-[var(--yellow)] bg-[var(--yellow)]"
                              : "border-[var(--border-1)]"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(user.id)}
                          className="sr-only"
                        />
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[9px] font-medium text-white">
                          {`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-xs text-[var(--heading)]">
                            {user.first_name} {user.last_name}
                          </span>
                          {user.job_title && (
                            <span className="block truncate text-[10px] text-[var(--text-muted)]">
                              {user.job_title}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                {filteredUsers.filter((u) => u.id !== managerId).length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                    Aucun collaborateur trouvé
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-1)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[var(--border-1)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-black/[0.03] disabled:opacity-50"
            >
              Annuler
            </button>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  En cours...
                </span>
              ) : isEdit ? (
                "Enregistrer"
              ) : (
                "Créer l'équipe"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
