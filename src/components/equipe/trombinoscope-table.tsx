"use client";

import { useState, useMemo } from "react";
import { Users, Mail, Phone, Eye, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import ProfileDrawer from "./profile-drawer";
import type { Profile } from "@/lib/types/database";

const DEPT_VARIANTS: Record<string, "yellow" | "blue" | "green" | "red" | "purple" | "default"> = {
  "Travaux": "yellow",
  "Ingénierie": "blue",
  "Administration": "purple",
  "Ressources Humaines": "red",
  "Direction": "green",
};

interface TrombinoscopeTableProps {
  users: Profile[];
  birthdayIds: string[];
  currentUserId: string;
}

export default function TrombinoscopeTable({
  users,
  birthdayIds,
  currentUserId,
}: TrombinoscopeTableProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const birthdaySet = useMemo(() => new Set(birthdayIds), [birthdayIds]);

  const departments = useMemo(
    () => [...new Set(users.map((u) => u.department).filter(Boolean))].sort(),
    [users]
  );
  const agencies = useMemo(
    () => [...new Set(users.map((u) => u.agency).filter(Boolean))].sort(),
    [users]
  );

  const columns: ColumnDef<Profile>[] = [
    {
      key: "avatar",
      header: "",
      width: "50px",
      render: (user) => {
        const initials =
          `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
        const hasBirthday = birthdaySet.has(user.id);
        return (
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white",
                  hasBirthday
                    ? "bg-gradient-to-br from-pink-500 to-orange-400"
                    : "bg-[var(--navy)]"
                )}
              >
                {initials}
              </div>
            )}
            {hasBirthday && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-100">
                <Cake className="h-2.5 w-2.5 text-pink-500" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Nom",
      sortable: true,
      accessor: (user) => `${user.first_name} ${user.last_name}`,
      render: (user) => (
        <div>
          <span className="font-medium text-[var(--heading)]">
            {user.first_name}{" "}
            <span className="uppercase">{user.last_name}</span>
          </span>
        </div>
      ),
    },
    {
      key: "job_title",
      header: "Poste",
      sortable: true,
      render: (user) => (
        <span className="text-[var(--text-secondary)]">
          {user.job_title || "—"}
        </span>
      ),
    },
    {
      key: "department",
      header: "Service",
      sortable: true,
      render: (user) =>
        user.department ? (
          <Badge variant={DEPT_VARIANTS[user.department] ?? "default"}>
            {user.department}
          </Badge>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: "agency",
      header: "Site",
      sortable: true,
      render: (user) => (
        <span className="text-[var(--text-secondary)]">
          {user.agency || "—"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Téléphone",
      render: (user) =>
        user.phone ? (
          <a
            href={`tel:${user.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--text-secondary)] hover:text-[var(--navy)]"
          >
            {user.phone}
          </a>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) =>
        user.email ? (
          <a
            href={`mailto:${user.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--text-secondary)] hover:text-[var(--navy)]"
          >
            {user.email}
          </a>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
  ];

  const filters: FilterDef[] = [];
  if (departments.length > 0) {
    filters.push({
      key: "department",
      label: "Service",
      type: "select",
      placeholder: "Tous les services",
      options: departments.map((d) => ({ label: d!, value: d! })),
    });
  }
  if (agencies.length > 1) {
    filters.push({
      key: "agency",
      label: "Site",
      type: "select",
      placeholder: "Tous les sites",
      options: agencies.map((a) => ({ label: a!, value: a! })),
    });
  }

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        keyField="id"
        title="Trombinoscope"
        description="L'annuaire de tous les collaborateurs INNOVTEC Réseaux."
        toolbarActions={getStandardToolbarActions()}
        selectable
        searchable
        searchPlaceholder="Rechercher un collaborateur..."
        filters={filters}
        onRowClick={(user) => setSelectedUser(user)}
        emptyState={{
          icon: Users,
          title: "Aucun collaborateur trouvé",
          description: "Modifiez vos critères de recherche.",
        }}
        actions={(user) => [
          {
            label: "Voir le profil",
            icon: Eye,
            onClick: () => setSelectedUser(user),
          },
          ...(user.email
            ? [{
                label: "Envoyer un email",
                icon: Mail,
                onClick: () => window.location.href = `mailto:${user.email}`,
              }]
            : []),
          ...(user.phone
            ? [{
                label: "Appeler",
                icon: Phone,
                onClick: () => window.location.href = `tel:${user.phone}`,
              }]
            : []),
        ]}
      />

      <ProfileDrawer
        profile={selectedUser}
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        isBirthday={selectedUser ? birthdaySet.has(selectedUser.id) : false}
        currentUserId={currentUserId}
      />
    </>
  );
}
