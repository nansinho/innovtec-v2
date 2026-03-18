"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  UserPlus,
  Filter,
  Eye,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { updateUserRole, toggleUserActive, deleteUser } from "@/actions/users";
import { updateUserJobTitle, addJobTitle, type JobTitle } from "@/actions/job-titles";
import type { Department } from "@/actions/departments";
import type { Team } from "@/actions/teams";
import type { TeamWithMembers } from "@/lib/types/database";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import type { Profile, UserRole } from "@/lib/types/database";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import UserFormModal from "@/components/admin/user-form-modal";
import { Badge } from "@/components/ui/badge";
import { ROLE_MAP } from "@/lib/status-config";
import { createReferenceMap } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  collaborateur: "Collaborateur",
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "collaborateur", label: "Collaborateur" },
];

interface UsersTableProps {
  users: Profile[];
  currentUserId: string;
  currentUserRole: string;
  jobTitles: JobTitle[];
  departments: Department[];
  teams: Team[];
  teamsWithMembers?: TeamWithMembers[];
}

export default function UsersTable({ users, currentUserId, currentUserRole, jobTitles: initialJobTitles, departments, teams, teamsWithMembers = [] }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingJobTitle, setEditingJobTitle] = useState<string | null>(null);
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [jobTitles, setJobTitles] = useState(initialJobTitles);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const refMap = useMemo(() => createReferenceMap(users, "USER"), [users]);

  // Build a map: userId -> list of teams
  const userTeamsMap = useMemo(() => {
    const map = new Map<string, { teamLabel: string; role: string }[]>();
    for (const team of teamsWithMembers) {
      for (const member of team.members) {
        const list = map.get(member.user_id) ?? [];
        list.push({ teamLabel: team.label, role: member.role });
        map.set(member.user_id, list);
      }
    }
    return map;
  }, [teamsWithMembers]);

  // Modals
  const [formModal, setFormModal] = useState<{ open: boolean; user: Profile | null }>({
    open: false,
    user: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "delete" | "toggle";
    userId: string;
    userName: string;
    isActive?: boolean;
  }>({ open: false, type: "delete", userId: "", userName: "" });

  const isAdmin = currentUserRole === "admin";

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.job_title || "").toLowerCase().includes(q) ||
      (roleLabels[u.role] || "").toLowerCase().includes(q);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "inactive" && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  async function handleRoleChange(userId: string, role: UserRole) {
    setLoading(userId);
    const result = await updateUserRole(userId, role);
    if (result.success) {
      toast.success("Rôle mis à jour");
    } else {
      toast.error(result.error || "Erreur lors du changement de rôle");
    }
    setEditingRole(null);
    setLoading(null);
  }

  async function handleJobTitleChange(userId: string, jobTitle: string) {
    if (jobTitle === "__custom__") {
      setShowCustomInput(true);
      return;
    }
    setLoading(userId);
    const result = await updateUserJobTitle(userId, jobTitle);
    if (result.success) {
      toast.success("Poste mis à jour");
    } else {
      toast.error(result.error || "Erreur");
    }
    setEditingJobTitle(null);
    setLoading(null);
  }

  async function handleAddCustomJobTitle(userId: string) {
    if (!customJobTitle.trim()) return;
    setLoading(userId);

    const addResult = await addJobTitle(customJobTitle.trim());
    if (addResult.success && addResult.jobTitle) {
      setJobTitles((prev) => [...prev, addResult.jobTitle!].sort((a, b) => a.label.localeCompare(b.label)));
    }

    const result = await updateUserJobTitle(userId, customJobTitle.trim());
    if (result.success) {
      toast.success("Poste ajouté et assigné");
    } else {
      toast.error(result.error || "Erreur");
    }
    setCustomJobTitle("");
    setShowCustomInput(false);
    setEditingJobTitle(null);
    setLoading(null);
  }

  async function handleToggleActive() {
    const { userId, isActive } = confirmDialog;
    setLoading(userId);
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    const result = await toggleUserActive(userId, !isActive);
    if (result.success) {
      toast.success(isActive ? "Utilisateur désactivé" : "Utilisateur réactivé");
    } else {
      toast.error(result.error || "Erreur");
    }
    setLoading(null);
  }

  async function handleDelete() {
    const { userId } = confirmDialog;
    setLoading(userId);
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("Utilisateur supprimé définitivement");
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
    setLoading(null);
  }

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  const allPageSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        filtered.forEach((u) => next.delete(u.id));
      } else {
        filtered.forEach((u) => next.add(u.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher un collaborateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-[var(--border-1)] bg-white pl-9 pr-7 text-xs text-[var(--heading)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 rounded-lg border border-[var(--border-1)] bg-white pl-8 pr-8 text-xs text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              >
                <option value="all">Tous les rôles</option>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-[var(--border-1)] bg-white px-3 text-xs text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            >
              <option value="all">Tous ({users.length})</option>
              <option value="active">Actifs ({activeCount})</option>
              <option value="inactive">Inactifs ({inactiveCount})</option>
            </select>
          </div>
        </div>

        {/* Toolbar actions + Add button */}
        <div className="flex items-center gap-2">
          {getStandardToolbarActions().map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--border-1)] bg-white px-2.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-xs transition-all hover:bg-zinc-50 hover:text-[var(--heading)] hover:border-zinc-300 active:scale-[0.98]"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          })}
          <Button size="sm" onClick={() => setFormModal({ open: true, user: null })}>
            <UserPlus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-2 text-[11px] text-[var(--text-muted)]">
        <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        {search && <span>pour « {search} »</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
        {/* Batch actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
            <span className="font-medium text-amber-800">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
            <span className="text-amber-300">—</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-amber-500 hover:text-amber-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <table className="w-full text-left text-[13px] text-[var(--text)]">
          <thead className="border-b border-[var(--border-2)] bg-[var(--hover)]">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-300 accent-[var(--yellow)]"
                  aria-label="Sélectionner tout"
                />
              </th>
              <th className="w-12 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                ID
              </th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Collaborateur
              </th>
              <th className="hidden px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] md:table-cell">
                Poste
              </th>
              <th className="hidden px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] lg:table-cell">
                Manager
              </th>
              <th className="hidden px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] xl:table-cell">
                Équipe(s)
              </th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Rôle
              </th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Statut
              </th>
              <th className="w-14 px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-1)]">
            {filtered.map((user, idx) => {
              const isMe = user.id === currentUserId;
              const initials =
                `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";

              return (
                <tr
                  key={user.id}
                  className={`transition-colors duration-200 ${
                    selectedIds.has(user.id) ? "bg-amber-50/50" : "hover:bg-[var(--hover)]"
                  } ${!user.is_active ? "opacity-50" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleOne(user.id)}
                      className="h-4 w-4 rounded border-zinc-300 accent-[var(--yellow)]"
                    />
                  </td>
                  {/* # */}
                  <td className="px-3 py-2 text-[var(--text-muted)]">{refMap.get(user.id)}</td>
                  {/* User info */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[10px] font-medium text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">
                            {user.first_name} {user.last_name}
                          </span>
                          {isMe && (
                            <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                              (vous)
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-[var(--text-muted)]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Job title - editable with select */}
                  <td className="hidden px-3 py-2 md:table-cell">
                    {editingJobTitle === user.id ? (
                      <div className="flex flex-col gap-1.5">
                        {showCustomInput ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              value={customJobTitle}
                              onChange={(e) => setCustomJobTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddCustomJobTitle(user.id);
                                if (e.key === "Escape") {
                                  setShowCustomInput(false);
                                  setEditingJobTitle(null);
                                }
                              }}
                              autoFocus
                              placeholder="Nouveau poste..."
                              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-1.5 text-xs outline-none focus:border-[var(--yellow)]"
                            />
                            <button
                              onClick={() => handleAddCustomJobTitle(user.id)}
                              className="shrink-0 rounded-[var(--radius-xs)] bg-[var(--yellow)] p-1.5 text-white hover:bg-[var(--yellow-hover)]"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <select
                            defaultValue={user.job_title || ""}
                            onChange={(e) => handleJobTitleChange(user.id, e.target.value)}
                            onBlur={() => {
                              if (!showCustomInput) setEditingJobTitle(null);
                            }}
                            autoFocus
                            className="w-full rounded-xl border border-[var(--border-1)] px-2 py-1.5 text-xs outline-none transition-colors focus:border-[var(--yellow)]"
                          >
                            <option value="">— Aucun poste —</option>
                            {jobTitles.map((jt) => (
                              <option key={jt.id} value={jt.label}>
                                {jt.label}
                              </option>
                            ))}
                            <option value="__custom__">+ Ajouter un poste...</option>
                          </select>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingJobTitle(user.id)}
                        className="text-xs transition-colors hover:text-[var(--heading)]"
                        title="Cliquer pour modifier le poste"
                      >
                        {user.job_title || "—"}
                      </button>
                    )}
                  </td>

                  {/* Manager */}
                  <td className="hidden px-3 py-2 lg:table-cell">
                    {(() => {
                      const mgr = user.manager_id
                        ? users.find((u) => u.id === user.manager_id)
                        : null;
                      return (
                        <span className="text-xs">
                          {mgr
                            ? `${mgr.first_name} ${mgr.last_name}`
                            : "—"}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Équipe(s) */}
                  <td className="hidden px-3 py-2 xl:table-cell">
                    {(() => {
                      const teams: { teamLabel: string; role: string }[] | undefined = userTeamsMap.get(user.id);
                      if (!teams || teams.length === 0) {
                        return <span className="text-xs text-[var(--text-muted)]">—</span>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1">
                          {teams.map((t, i) => (
                            <Badge key={i} variant={t.role === "manager" ? "amber" : "blue"} size="sm">
                              {t.teamLabel}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Role */}
                  <td className="px-3 py-2">
                    {editingRole === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        onBlur={() => setEditingRole(null)}
                        autoFocus
                        className="rounded-xl border border-[var(--border-1)] px-2 py-1.5 text-xs outline-none transition-colors focus:border-[var(--yellow)]"
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={user.role} />
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <Badge variant={user.is_active ? "green" : "gray"} dot>
                      {user.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>

                  {/* Actions — 3-dot dropdown menu */}
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu
                      items={[
                        {
                          label: "Voir le profil",
                          icon: Eye,
                          onClick: () => {
                            window.location.href = user.id === currentUserId ? "/profil" : `/admin/users/${user.id}`;
                          },
                        },
                        {
                          label: "Modifier",
                          icon: Pencil,
                          onClick: () => setFormModal({ open: true, user }),
                        },
                        ...(!isMe
                          ? [
                              {
                                label: "Changer le rôle",
                                icon: Shield,
                                onClick: () => setEditingRole(user.id),
                              },
                              {
                                label: user.is_active ? "Désactiver" : "Réactiver",
                                icon: user.is_active ? UserX : UserCheck,
                                onClick: () =>
                                  setConfirmDialog({
                                    open: true,
                                    type: "toggle",
                                    userId: user.id,
                                    userName: `${user.first_name} ${user.last_name}`,
                                    isActive: user.is_active,
                                  }),
                                variant: user.is_active ? ("danger" as const) : ("default" as const),
                              },
                              ...(isAdmin
                                ? [
                                    {
                                      label: "Supprimer",
                                      icon: Trash2,
                                      onClick: () =>
                                        setConfirmDialog({
                                          open: true,
                                          type: "delete",
                                          userId: user.id,
                                          userName: `${user.first_name} ${user.last_name}`,
                                        }),
                                      variant: "danger" as const,
                                    },
                                  ]
                                : []),
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
            Aucun collaborateur trouvé.
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, user: null })}
        user={formModal.user}
        jobTitles={jobTitles}
        departments={departments}
        teams={teams}
        teamsWithMembers={teamsWithMembers}
        allUsers={users}
        currentUserRole={currentUserRole}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.type === "delete" ? handleDelete : handleToggleActive}
        title={
          confirmDialog.type === "delete"
            ? "Supprimer l'utilisateur"
            : confirmDialog.isActive
            ? "Désactiver l'utilisateur"
            : "Réactiver l'utilisateur"
        }
        message={
          confirmDialog.type === "delete"
            ? `Êtes-vous sûr de vouloir supprimer définitivement ${confirmDialog.userName} ? Cette action est irréversible et supprimera toutes les données associées.`
            : confirmDialog.isActive
            ? `Êtes-vous sûr de vouloir désactiver ${confirmDialog.userName} ? Il ne pourra plus se connecter à l'application.`
            : `Êtes-vous sûr de vouloir réactiver ${confirmDialog.userName} ? Il pourra à nouveau se connecter.`
        }
        confirmLabel={
          confirmDialog.type === "delete"
            ? "Supprimer"
            : confirmDialog.isActive
            ? "Désactiver"
            : "Réactiver"
        }
        variant={
          confirmDialog.type === "delete"
            ? "danger"
            : confirmDialog.isActive
            ? "warning"
            : "info"
        }
        loading={loading === confirmDialog.userId}
      />
    </div>
  );
}
