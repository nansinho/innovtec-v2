"use client";

import { useState, useMemo, useCallback } from "react";
import {
  GitBranch,
  List,
  Upload,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateManager } from "@/actions/organigramme";
import type { OrgChartProfile } from "@/actions/organigramme";
import OrgChartImportModal from "./org-chart-import-modal";
import { Button } from "@/components/ui/button";

// ==========================================
// TYPES
// ==========================================

interface TreeNode {
  profile: OrgChartProfile;
  children: TreeNode[];
}

interface OrgChartProps {
  profiles: OrgChartProfile[];
  isAdmin: boolean;
}

// ==========================================
// TREE BUILDER
// ==========================================

function buildTree(profiles: OrgChartProfile[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  for (const p of profiles) {
    map.set(p.id, { profile: p, children: [] });
  }

  // Build parent-child relationships
  for (const p of profiles) {
    const node = map.get(p.id)!;
    if (p.manager_id && map.has(p.manager_id)) {
      map.get(p.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by last_name
  function sortChildren(node: TreeNode) {
    node.children.sort((a, b) =>
      a.profile.last_name.localeCompare(b.profile.last_name)
    );
    node.children.forEach(sortChildren);
  }
  roots.sort((a, b) => a.profile.last_name.localeCompare(b.profile.last_name));
  roots.forEach(sortChildren);

  return roots;
}

// ==========================================
// TREE NODE COMPONENT (visual tree)
// ==========================================

function OrgTreeNode({
  node,
  isAdmin,
  allProfiles,
  onManagerChange,
}: {
  node: TreeNode;
  isAdmin: boolean;
  allProfiles: OrgChartProfile[];
  onManagerChange: (userId: string, managerId: string | null) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingManager, setEditingManager] = useState(false);
  const p = node.profile;
  const initials =
    `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className="relative group">
        <div
          className={cn(
            "relative flex flex-col items-center rounded-xl border bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md min-w-[160px] max-w-[200px]",
            editingManager
              ? "border-[var(--yellow)] ring-2 ring-[var(--yellow-surface)]"
              : "border-[var(--border-1)]"
          )}
        >
          {/* Avatar */}
          {p.avatar_url ? (
            <img
              src={p.avatar_url}
              alt={`${p.first_name} ${p.last_name}`}
              className="h-10 w-10 rounded-full border border-[var(--border-1)] object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                p.gender === "F"
                  ? "bg-gradient-to-br from-pink-400 to-pink-500"
                  : p.gender === "M"
                    ? "bg-gradient-to-br from-blue-400 to-blue-500"
                    : "bg-[var(--navy)]"
              )}
            >
              {initials}
            </div>
          )}

          {/* Name */}
          <p className="mt-2 text-center text-[12px] font-semibold text-[var(--heading)] leading-tight">
            {p.first_name}{" "}
            <span className="uppercase">{p.last_name}</span>
          </p>

          {/* Job title */}
          <p className="mt-0.5 text-center text-[10px] text-[var(--text-muted)] leading-tight line-clamp-2">
            {p.job_title || p.department || "—"}
          </p>

          {/* Toggle children */}
          {hasChildren && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="mt-1.5 flex items-center gap-0.5 rounded-full bg-[var(--hover)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-1)]"
            >
              {collapsed ? (
                <>
                  <ChevronRight className="h-2.5 w-2.5" />
                  {node.children.length}
                </>
              ) : (
                <>
                  <ChevronDown className="h-2.5 w-2.5" />
                  {node.children.length}
                </>
              )}
            </button>
          )}

          {/* Admin edit button */}
          {isAdmin && (
            <button
              onClick={() => setEditingManager(!editingManager)}
              className="absolute -right-1 -top-1 hidden rounded-full bg-white p-1 shadow-sm ring-1 ring-[var(--border-1)] transition-all group-hover:flex hover:bg-[var(--yellow-surface)]"
              title="Changer le manager"
            >
              <UserCog className="h-3 w-3 text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {/* Manager edit dropdown */}
        {editingManager && isAdmin && (
          <div className="absolute left-1/2 top-full z-50 mt-1 w-[220px] -translate-x-1/2 rounded-xl border border-[var(--border-1)] bg-white p-2 shadow-lg">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                Choisir le manager
              </span>
              <button onClick={() => setEditingManager(false)}>
                <X className="h-3 w-3 text-[var(--text-muted)]" />
              </button>
            </div>
            <button
              onClick={() => {
                onManagerChange(p.id, null);
                setEditingManager(false);
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)]"
            >
              Aucun (racine)
            </button>
            <div className="max-h-[200px] overflow-y-auto">
              {allProfiles
                .filter((pr) => pr.id !== p.id)
                .map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => {
                      onManagerChange(p.id, pr.id);
                      setEditingManager(false);
                    }}
                    className={cn(
                      "w-full rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-[var(--hover)]",
                      p.manager_id === pr.id
                        ? "bg-[var(--yellow-surface)] font-medium text-[var(--heading)]"
                        : "text-[var(--text)]"
                    )}
                  >
                    {pr.first_name} {pr.last_name}
                    {pr.job_title && (
                      <span className="ml-1 text-[var(--text-muted)]">
                        — {pr.job_title}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="relative mt-0">
          {/* Vertical connector from parent */}
          <div className="mx-auto h-5 w-px bg-[var(--border-1)]" />

          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <div className="relative flex justify-center">
              <div
                className="absolute top-0 h-px bg-[var(--border-1)]"
                style={{
                  left: `${100 / (2 * node.children.length)}%`,
                  right: `${100 / (2 * node.children.length)}%`,
                }}
              />
            </div>
          )}

          {/* Children nodes */}
          <div className="flex gap-2 items-start">
            {node.children.map((child) => (
              <div key={child.profile.id} className="flex flex-col items-center">
                {/* Vertical connector to child */}
                <div className="h-5 w-px bg-[var(--border-1)]" />
                <OrgTreeNode
                  node={child}
                  isAdmin={isAdmin}
                  allProfiles={allProfiles}
                  onManagerChange={onManagerChange}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// LIST VIEW ROW
// ==========================================

function ListRow({
  profile,
  depth,
  allProfiles,
  isAdmin,
  onManagerChange,
}: {
  profile: OrgChartProfile;
  depth: number;
  allProfiles: OrgChartProfile[];
  isAdmin: boolean;
  onManagerChange: (userId: string, managerId: string | null) => void;
}) {
  const [editingManager, setEditingManager] = useState(false);
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const manager = profile.manager_id
    ? allProfiles.find((p) => p.id === profile.manager_id)
    : null;

  return (
    <tr className="transition-colors hover:bg-[var(--hover)]">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white",
                profile.gender === "F"
                  ? "bg-gradient-to-br from-pink-400 to-pink-500"
                  : profile.gender === "M"
                    ? "bg-gradient-to-br from-blue-400 to-blue-500"
                    : "bg-[var(--navy)]"
              )}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-[13px] font-medium text-[var(--heading)]">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">{profile.email}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-2.5 text-[12px] text-[var(--text)] md:table-cell">
        {profile.job_title || "—"}
      </td>
      <td className="hidden px-3 py-2.5 text-[12px] text-[var(--text)] lg:table-cell">
        {profile.department || "—"}
      </td>
      <td className="px-3 py-2.5">
        {isAdmin ? (
          editingManager ? (
            <select
              defaultValue={profile.manager_id ?? ""}
              onChange={(e) => {
                onManagerChange(profile.id, e.target.value || null);
                setEditingManager(false);
              }}
              onBlur={() => setEditingManager(false)}
              autoFocus
              className="w-full rounded-lg border border-[var(--border-1)] px-2 py-1 text-[11px] outline-none focus:border-[var(--yellow)]"
            >
              <option value="">— Aucun —</option>
              {allProfiles
                .filter((p) => p.id !== profile.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
            </select>
          ) : (
            <button
              onClick={() => setEditingManager(true)}
              className="text-[12px] text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
            >
              {manager
                ? `${manager.first_name} ${manager.last_name}`
                : "—"}
            </button>
          )
        ) : (
          <span className="text-[12px] text-[var(--text)]">
            {manager
              ? `${manager.first_name} ${manager.last_name}`
              : "—"}
          </span>
        )}
      </td>
    </tr>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function OrgChart({ profiles, isAdmin }: OrgChartProps) {
  const [view, setView] = useState<"tree" | "list">("tree");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);

  const tree = useMemo(() => buildTree(profiles), [profiles]);

  const handleManagerChange = useCallback(
    async (userId: string, managerId: string | null) => {
      const result = await updateManager(userId, managerId);
      if (result.success) {
        toast.success("Manager mis à jour");
      } else {
        toast.error(result.error || "Erreur");
      }
    },
    []
  );

  // Flatten tree for list view
  const flatList = useMemo(() => {
    const list: { profile: OrgChartProfile; depth: number }[] = [];
    function walk(nodes: TreeNode[], depth: number) {
      for (const n of nodes) {
        list.push({ profile: n.profile, depth });
        walk(n.children, depth + 1);
      }
    }
    walk(tree, 0);
    return list;
  }, [tree]);

  // Filter for list view
  const filteredList = useMemo(() => {
    if (!search) return flatList;
    const q = search.toLowerCase();
    return flatList.filter(({ profile: p }) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (p.job_title ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.department ?? "").toLowerCase().includes(q)
      );
    });
  }, [flatList, search]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-[var(--border-1)] bg-white p-0.5">
            <button
              onClick={() => setView("tree")}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                view === "tree"
                  ? "bg-[var(--navy)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--heading)]"
              )}
            >
              <GitBranch className="mr-1 inline h-3 w-3" />
              Arbre
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                view === "list"
                  ? "bg-[var(--navy)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--heading)]"
              )}
            >
              <List className="mr-1 inline h-3 w-3" />
              Liste
            </button>
          </div>

          {/* Search (list view) */}
          {view === "list" && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-52 rounded-lg border border-[var(--border-1)] bg-white pl-8 pr-3 text-xs text-[var(--heading)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
          )}
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="h-3.5 w-3.5" />
            Importer
          </Button>
        )}
      </div>

      {/* Tree View */}
      {view === "tree" && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-1)] bg-[var(--hover)] p-8">
          {tree.length === 0 ? (
            <div className="py-16 text-center">
              <GitBranch className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Aucune hiérarchie définie
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                Utilisez l&apos;import ou assignez des managers depuis la vue liste
              </p>
            </div>
          ) : (
            <div className="flex justify-center gap-6 items-start">
              {tree.map((rootNode) => (
                <OrgTreeNode
                  key={rootNode.profile.id}
                  node={rootNode}
                  isAdmin={isAdmin}
                  allProfiles={profiles}
                  onManagerChange={handleManagerChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-[var(--border-2)] bg-[var(--hover)]">
              <tr>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Collaborateur
                </th>
                <th className="hidden px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] md:table-cell">
                  Poste
                </th>
                <th className="hidden px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] lg:table-cell">
                  Département
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Manager
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {filteredList.map(({ profile, depth }) => (
                <ListRow
                  key={profile.id}
                  profile={profile}
                  depth={search ? 0 : depth}
                  allProfiles={profiles}
                  isAdmin={isAdmin}
                  onManagerChange={handleManagerChange}
                />
              ))}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
              Aucun collaborateur trouvé.
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <OrgChartImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
