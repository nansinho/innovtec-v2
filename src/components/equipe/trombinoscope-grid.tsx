"use client";

import { useState, useMemo } from "react";
import { Search, Users, Filter, Cake, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileDrawer from "./profile-drawer";
import type { Profile } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { EQUIPE_MAP } from "@/lib/status-config";

interface TrombinoscopeGridProps {
  users: Profile[];
  birthdayIds: string[];
  currentUserId: string;
}

export default function TrombinoscopeGrid({
  users,
  birthdayIds,
  currentUserId,
}: TrombinoscopeGridProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Extract unique values for filters
  const departments = useMemo(
    () => [...new Set(users.map((u) => u.department).filter(Boolean))].sort(),
    [users]
  );
  const agencies = useMemo(
    () => [...new Set(users.map((u) => u.agency).filter(Boolean))].sort(),
    [users]
  );

  // Filter users
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (deptFilter && u.department !== deptFilter) return false;
      if (agencyFilter && u.agency !== agencyFilter) return false;
      if (q) {
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        const job = (u.job_title ?? "").toLowerCase();
        const email = (u.email ?? "").toLowerCase();
        return fullName.includes(q) || job.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [users, search, deptFilter, agencyFilter]);

  const birthdaySet = useMemo(() => new Set(birthdayIds), [birthdayIds]);

  return (
    <>
      {/* Search & Filters bar */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher un collaborateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] py-2 pl-10 pr-4 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--text-muted)]" />
            {departments.length > 0 && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-2.5 py-2 text-xs text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)]"
              >
                <option value="">Tous les départements</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
            {agencies.length > 1 && (
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-2.5 py-2 text-xs text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)]"
              >
                <option value="">Toutes les agences</option>
                {agencies.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
          <Users className="h-3.5 w-3.5" />
          <span>
            {filtered.length} collaborateur{filtered.length > 1 ? "s" : ""}
            {(deptFilter || agencyFilter || search) && ` (sur ${users.length})`}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-sm">
          <Users className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Aucun collaborateur trouvé
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((user) => {
            const initials =
              `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
            const hasBirthday = birthdaySet.has(user.id);
            const deptEntry = EQUIPE_MAP[user.department];

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="group relative flex flex-col items-center rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] px-4 py-5 text-center shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-[var(--yellow)]/40 hover:shadow-md"
              >
                {/* Birthday badge */}
                {hasBirthday && (
                  <div className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-500 animate-bounce">
                    <Cake className="h-3.5 w-3.5" />
                  </div>
                )}

                {/* Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-16 w-16 rounded-full border-2 border-[var(--border-1)] object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white",
                      hasBirthday
                        ? "bg-gradient-to-br from-pink-500 to-orange-400"
                        : user.gender === "F"
                          ? "bg-gradient-to-br from-pink-400 to-pink-500"
                          : user.gender === "M"
                            ? "bg-gradient-to-br from-blue-400 to-blue-500"
                            : "bg-[var(--navy)]"
                    )}
                  >
                    {initials}
                  </div>
                )}

                {/* Name */}
                <p className="mt-3 text-[13px] font-semibold text-[var(--heading)] leading-tight">
                  {user.first_name}{" "}
                  <span className="uppercase">{user.last_name}</span>
                </p>

                {/* Job title */}
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)] line-clamp-1">
                  {user.job_title || "Collaborateur"}
                </p>

                {/* Department badge */}
                {user.department && (
                  <Badge variant={deptEntry?.variant ?? "gray"} dot={false} size="sm" className="mt-2">
                    {user.department}
                  </Badge>
                )}

                {/* Contact icons on hover */}
                <div className="mt-2.5 flex items-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {user.email && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${user.email}`;
                      }}
                      className="rounded-full bg-[var(--hover)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--yellow-surface)] hover:text-[var(--yellow)]"
                    >
                      <Mail className="h-3 w-3" />
                    </span>
                  )}
                  {user.phone && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${user.phone}`;
                      }}
                      className="rounded-full bg-[var(--hover)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--yellow-surface)] hover:text-[var(--yellow)]"
                    >
                      <Phone className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Profile Drawer */}
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
