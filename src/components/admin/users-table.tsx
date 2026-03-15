"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  Pencil,
  Trash2,
  UserPlus,
  Filter,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { updateUserRole, toggleUserActive, deleteUser } from "@/actions/users";
import type { Profile, UserRole } from "@/lib/types/database";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import UserFormModal from "@/components/admin/user-form-modal";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
  collaborateur: "Collaborateur",
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "collaborateur", label: "Collaborateur" },
  { value: "rh", label: "Ressources Humaines" },
  { value: "responsable_qse", label: "Responsable QSE" },
  { value: "chef_chantier", label: "Chef de chantier" },
  { value: "technicien", label: "Technicien" },
];

const roleBadgeColors: Record<string, string> = {
  admin: "bg-[var(--red-surface)] text-[var(--red)]",
  rh: "bg-[var(--purple-surface)] text-[var(--purple)]",
  responsable_qse: "bg-[var(--blue-surface)] text-[var(--blue)]",
  chef_chantier: "bg-orange-50 text-orange-700",
  technicien: "bg-[var(--hover)] text-[var(--text-secondary)]",
  collaborateur: "bg-[var(--green-surface)] text-[var(--green)]",
};

interface UsersTableProps {
  users: Profile[];
  currentUserId: string;
  currentUserRole: string;
}

export default function UsersTable({ users, currentUserId, currentUserRole }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

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
              className="w-full rounded-xl border border-[var(--border-1)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-[var(--border-1)] bg-white py-2 pl-8 pr-8 text-xs text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--yellow)]"
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
              className="rounded-xl border border-[var(--border-1)] bg-white py-2 px-3 text-xs text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--yellow)]"
            >
              <option value="all">Tous ({users.length})</option>
              <option value="active">Actifs ({activeCount})</option>
              <option value="inactive">Inactifs ({inactiveCount})</option>
            </select>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={() => setFormModal({ open: true, user: null })}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-700 active:scale-[0.97]"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-2 text-[11px] text-[var(--text-muted)]">
        <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        {search && <span>pour « {search} »</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-1)] bg-white shadow-sm ring-1 ring-black/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-1)] bg-[var(--hover)]">
            <tr>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Collaborateur
              </th>
              <th className="hidden px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)] md:table-cell">
                Poste
              </th>
              <th className="hidden px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)] lg:table-cell">
                Département
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Rôle
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Statut
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-1)]">
            {filtered.map((user) => {
              const isMe = user.id === currentUserId;
              const initials =
                `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";

              return (
                <tr
                  key={user.id}
                  className={`transition-colors duration-200 hover:bg-[var(--hover)] ${
                    !user.is_active ? "opacity-50" : ""
                  }`}
                >
                  {/* User info */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[10px] font-medium text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-[var(--heading)]">
                            {user.first_name} {user.last_name}
                          </span>
                          {isMe && (
                            <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                              (vous)
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-[var(--text-secondary)]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Job title */}
                  <td className="hidden px-4 py-3.5 text-xs text-[var(--text-secondary)] md:table-cell">
                    {user.job_title || "—"}
                  </td>

                  {/* Department */}
                  <td className="hidden px-4 py-3.5 text-xs text-[var(--text-secondary)] lg:table-cell">
                    {user.department || "—"}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
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
                      <button
                        onClick={() => !isMe && setEditingRole(user.id)}
                        disabled={isMe}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity duration-200 ${
                          roleBadgeColors[user.role] ?? "bg-[var(--hover)] text-[var(--text-secondary)]"
                        } ${isMe ? "cursor-default" : "cursor-pointer hover:opacity-80"}`}
                        title={isMe ? "Vous ne pouvez pas changer votre propre rôle" : "Cliquer pour modifier"}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        user.is_active
                          ? "bg-[var(--green-surface)] text-[var(--green)]"
                          : "bg-[var(--red-surface)] text-[var(--red)]"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} />
                      {user.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      {/* View profile */}
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]"
                        title="Voir le profil"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      {!isMe && (
                        <>
                          {/* Edit */}
                          <button
                            onClick={() => setFormModal({ open: true, user })}
                            disabled={loading === user.id}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--blue-surface)] hover:text-[var(--blue)] disabled:opacity-50"
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Role */}
                          <button
                            onClick={() => setEditingRole(user.id)}
                            disabled={loading === user.id}
                            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--purple-surface)] hover:text-[var(--purple)] disabled:opacity-50"
                            title="Changer le rôle"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </button>

                          {/* Toggle active */}
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                type: "toggle",
                                userId: user.id,
                                userName: `${user.first_name} ${user.last_name}`,
                                isActive: user.is_active,
                              })
                            }
                            disabled={loading === user.id}
                            className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                              user.is_active
                                ? "text-[var(--text-muted)] hover:bg-orange-50 hover:text-orange-600"
                                : "text-[var(--green)] hover:bg-[var(--green-surface)]"
                            }`}
                            title={user.is_active ? "Désactiver" : "Réactiver"}
                          >
                            {user.is_active ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Delete (admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  type: "delete",
                                  userId: user.id,
                                  userName: `${user.first_name} ${user.last_name}`,
                                })
                              }
                              disabled={loading === user.id}
                              className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--red-surface)] hover:text-[var(--red)] disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
