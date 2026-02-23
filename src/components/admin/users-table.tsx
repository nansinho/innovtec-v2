"use client";

import { useState } from "react";
import {
  Search,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { updateUserRole, toggleUserActive } from "@/actions/users";
import type { Profile, UserRole } from "@/lib/types/database";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
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
};

interface UsersTableProps {
  users: Profile[];
  currentUserId: string;
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.job_title || "").toLowerCase().includes(q) ||
      (roleLabels[u.role] || "").toLowerCase().includes(q)
    );
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

  async function handleToggleActive(userId: string, isActive: boolean) {
    if (
      !confirm(
        isActive
          ? "Réactiver cet utilisateur ?"
          : "Désactiver cet utilisateur ? Il ne pourra plus se connecter."
      )
    )
      return;

    setLoading(userId);
    const result = await toggleUserActive(userId, isActive);
    if (result.success) {
      toast.success(isActive ? "Utilisateur réactivé" : "Utilisateur désactivé");
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
    setLoading(null);
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher un collaborateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] py-2.5 pl-10 pr-4 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
        />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border-1)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-1)] bg-[var(--hover)]">
            <tr>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Collaborateur
              </th>
              <th className="px-4 py-3.5 text-xs font-medium text-[var(--text-secondary)]">
                Poste
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
          <tbody className="divide-y divide-[var(--border-1)] bg-[var(--card)]">
            {filtered.map((user) => {
              const isMe = user.id === currentUserId;
              const initials =
                `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
                "?";

              return (
                <tr
                  key={user.id}
                  className={`transition-colors duration-200 hover:bg-[var(--hover)] ${
                    !user.is_active ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[10px] font-medium text-white">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--heading)]">
                          {user.first_name} {user.last_name}
                          {isMe && (
                            <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">
                              (vous)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">
                    {user.job_title || "—"}
                  </td>

                  <td className="px-4 py-3.5">
                    {editingRole === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        onBlur={() => setEditingRole(null)}
                        autoFocus
                        className="rounded-[var(--radius-xs)] border border-[var(--border-1)] px-2 py-1.5 text-xs outline-none transition-colors focus:border-[var(--yellow)]"
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

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        user.is_active
                          ? "bg-[var(--green-surface)] text-[var(--green)]"
                          : "bg-[var(--red-surface)] text-[var(--red)]"
                      }`}
                    >
                      {user.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      {!isMe && (
                        <>
                          <button
                            onClick={() => setEditingRole(user.id)}
                            disabled={loading === user.id}
                            className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--hover)] disabled:opacity-50"
                            title="Changer le rôle"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActive(user.id, !user.is_active)
                            }
                            disabled={loading === user.id}
                            className={`rounded-[var(--radius-xs)] p-1.5 transition-colors duration-200 disabled:opacity-50 ${
                              user.is_active
                                ? "text-[var(--text-muted)] hover:bg-[var(--red-surface)] hover:text-[var(--red)]"
                                : "text-[var(--green)] hover:bg-[var(--green-surface)]"
                            }`}
                            title={
                              user.is_active ? "Désactiver" : "Réactiver"
                            }
                          >
                            {user.is_active ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                          </button>
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
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Aucun collaborateur trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
