"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  GitBranch,
  List,
  Upload,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  UserCog,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripVertical,
  Mail,
  Building2,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateManager } from "@/actions/organigramme";
import type { OrgChartProfile } from "@/actions/organigramme";
import dynamic from "next/dynamic";

const OrgChartImportModal = dynamic(() => import("./org-chart-import-modal"), {
  ssr: false,
});
import { Button } from "@/components/ui/button";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

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

  for (const p of profiles) {
    map.set(p.id, { profile: p, children: [] });
  }

  for (const p of profiles) {
    const node = map.get(p.id)!;
    if (p.manager_id && map.has(p.manager_id)) {
      map.get(p.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

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
// HELPERS
// ==========================================

function getDescendantIds(node: TreeNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: TreeNode) {
    for (const child of n.children) {
      ids.add(child.profile.id);
      walk(child);
    }
  }
  walk(node);
  return ids;
}

function findNodeById(roots: TreeNode[], id: string): TreeNode | null {
  for (const root of roots) {
    if (root.profile.id === id) return root;
    const found = findNodeById(root.children, id);
    if (found) return found;
  }
  return null;
}

function getInitials(p: OrgChartProfile) {
  return (
    `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase() || "?"
  );
}

function getAvatarClasses(gender: string) {
  return gender === "F"
    ? "bg-gradient-to-br from-pink-400 to-pink-500"
    : gender === "M"
      ? "bg-gradient-to-br from-blue-400 to-blue-500"
      : "bg-[var(--navy)]";
}

// Collect all node IDs that match search + their ancestor IDs
function getSearchMatches(
  tree: TreeNode[],
  query: string
): { matches: Set<string>; expanded: Set<string> } {
  const matches = new Set<string>();
  const expanded = new Set<string>();
  if (!query) return { matches, expanded };

  const q = query.toLowerCase();

  function walk(node: TreeNode, ancestors: string[]): boolean {
    const p = node.profile;
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const isMatch =
      fullName.includes(q) ||
      (p.job_title ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.department ?? "").toLowerCase().includes(q);

    let childMatch = false;
    for (const child of node.children) {
      if (walk(child, [...ancestors, node.profile.id])) {
        childMatch = true;
      }
    }

    if (isMatch) {
      matches.add(p.id);
      ancestors.forEach((id) => expanded.add(id));
    }

    if (isMatch || childMatch) {
      expanded.add(p.id);
      return true;
    }

    return false;
  }

  for (const root of tree) {
    walk(root, []);
  }

  return { matches, expanded };
}

// ==========================================
// AVATAR COMPONENT
// ==========================================

function Avatar({
  profile,
  size = "md",
}: {
  profile: OrgChartProfile;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-sm";
  const initials = getInitials(profile);

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`${profile.first_name} ${profile.last_name}`}
        className={cn(
          "rounded-full border border-[var(--border-1)] object-cover",
          sizeClasses
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white",
        sizeClasses,
        getAvatarClasses(profile.gender)
      )}
    >
      {initials}
    </div>
  );
}

// ==========================================
// TOOLTIP COMPONENT
// ==========================================

function CardTooltip({ profile }: { profile: OrgChartProfile }) {
  return (
    <div className="absolute left-1/2 bottom-full z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border-1)] bg-white px-3 py-2 shadow-lg pointer-events-none">
      <div className="flex flex-col gap-1">
        {profile.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <Mail className="h-3 w-3 text-[var(--text-muted)]" />
            {profile.email}
          </div>
        )}
        {profile.department && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <Building2 className="h-3 w-3 text-[var(--text-muted)]" />
            {profile.department}
          </div>
        )}
        {profile.job_title && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <Briefcase className="h-3 w-3 text-[var(--text-muted)]" />
            {profile.job_title}
          </div>
        )}
      </div>
      <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px">
        <div className="h-2 w-2 rotate-45 border-b border-r border-[var(--border-1)] bg-white" />
      </div>
    </div>
  );
}

// ==========================================
// DRAGGABLE TREE CARD
// ==========================================

function DraggableTreeCard({
  node,
  isAdmin,
  allProfiles,
  tree,
  onManagerChange,
  activeId,
  search,
  searchMatches,
  searchExpanded,
  collapsedNodes,
  toggleCollapsed,
}: {
  node: TreeNode;
  isAdmin: boolean;
  allProfiles: OrgChartProfile[];
  tree: TreeNode[];
  onManagerChange: (userId: string, managerId: string | null) => void;
  activeId: string | null;
  search: string;
  searchMatches: Set<string>;
  searchExpanded: Set<string>;
  collapsedNodes: Set<string>;
  toggleCollapsed: (id: string) => void;
}) {
  const p = node.profile;
  const hasChildren = node.children.length > 0;
  const [editingManager, setEditingManager] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // DnD
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `tree-${p.id}`,
    data: { profileId: p.id, type: "tree" },
    disabled: !isAdmin,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `tree-drop-${p.id}`,
    data: { profileId: p.id, type: "tree" },
    disabled: !isAdmin,
  });

  // Check if this is a valid drop target
  const isValidTarget = useMemo(() => {
    if (!activeId || !isAdmin) return false;
    const draggedProfileId = activeId.replace("tree-", "").replace("list-", "");
    if (draggedProfileId === p.id) return false;
    // Can't drop on own descendant
    const draggedNode = findNodeById(tree, draggedProfileId);
    if (draggedNode) {
      const descendants = getDescendantIds(draggedNode);
      if (descendants.has(p.id)) return false;
    }
    return true;
  }, [activeId, p.id, tree, isAdmin]);

  const isBeingDragged = isDragging || activeId === `tree-${p.id}`;

  // Search highlighting
  const isSearchActive = search.length > 0;
  const isMatch = isSearchActive && searchMatches.has(p.id);
  const isFaded = isSearchActive && !isMatch && !searchExpanded.has(p.id);

  // Collapse logic: respect search (force expand if in expanded set)
  const isCollapsed =
    isSearchActive && searchExpanded.has(p.id)
      ? false
      : collapsedNodes.has(p.id);

  return (
    <div
      className={cn(
        "flex flex-col items-center transition-opacity duration-200",
        isFaded && "opacity-30"
      )}
    >
      {/* Card */}
      <div className="relative group" ref={setDropRef}>
        <div
          ref={setDragRef}
          {...(isAdmin ? { ...attributes, ...listeners } : {})}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={cn(
            "relative flex flex-col items-center rounded-xl border bg-white px-5 py-4 shadow-sm transition-all duration-200 w-[180px]",
            isAdmin && "cursor-grab active:cursor-grabbing",
            isBeingDragged && "opacity-30 scale-95",
            isOver && isValidTarget && "border-[var(--yellow)] ring-2 ring-[var(--yellow-surface)] scale-105",
            isOver && !isValidTarget && "border-red-300 ring-2 ring-red-100",
            isMatch && "border-[var(--yellow)] ring-2 ring-[var(--yellow-surface)] bg-[var(--yellow-surface)]/20",
            editingManager
              ? "border-[var(--yellow)] ring-2 ring-[var(--yellow-surface)]"
              : !isOver && !isMatch && "border-[var(--border-1)]"
          )}
        >
          <Avatar profile={p} />

          <p className="mt-2.5 text-center text-[12px] font-semibold text-[var(--heading)] leading-tight">
            {p.first_name}{" "}
            <span className="uppercase">{p.last_name}</span>
          </p>

          <p className="mt-0.5 text-center text-[10px] text-[var(--text-muted)] leading-tight line-clamp-2">
            {p.job_title || p.department || "—"}
          </p>

          {/* Children count badge */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapsed(p.id);
              }}
              className="mt-2 flex items-center gap-0.5 rounded-full bg-[var(--hover)] px-2.5 py-1 text-[9px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-1)]"
            >
              {isCollapsed ? (
                <ChevronRight className="h-2.5 w-2.5" />
              ) : (
                <ChevronDown className="h-2.5 w-2.5" />
              )}
              {node.children.length}
            </button>
          )}

          {/* Admin edit button */}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingManager(!editingManager);
              }}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-[var(--border-1)] transition-all opacity-0 group-hover:opacity-100 hover:bg-[var(--yellow-surface)]"
              title="Changer le manager"
            >
              <UserCog className="h-3 w-3 text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {/* Tooltip */}
        {showTooltip && !isDragging && !editingManager && !activeId && (
          <CardTooltip profile={p} />
        )}

        {/* Manager edit dropdown */}
        {editingManager && isAdmin && (
          <div className="absolute left-1/2 top-full z-50 mt-2 w-[240px] -translate-x-1/2 rounded-xl border border-[var(--border-1)] bg-white p-2 shadow-lg">
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
      {hasChildren && !isCollapsed && (
        <div className="relative mt-0">
          {/* Vertical connector from parent */}
          <div className="mx-auto h-6 w-px bg-[var(--border-2)]" />

          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <div className="relative flex justify-center">
              <div
                className="absolute top-0 h-px bg-[var(--border-2)]"
                style={{
                  left: `${100 / (2 * node.children.length)}%`,
                  right: `${100 / (2 * node.children.length)}%`,
                }}
              />
            </div>
          )}

          {/* Children nodes */}
          <div className="flex gap-5 items-start">
            {node.children.map((child) => (
              <div key={child.profile.id} className="flex flex-col items-center">
                <div className="h-6 w-px bg-[var(--border-2)]" />
                <DraggableTreeCard
                  node={child}
                  isAdmin={isAdmin}
                  allProfiles={allProfiles}
                  tree={tree}
                  onManagerChange={onManagerChange}
                  activeId={activeId}
                  search={search}
                  searchMatches={searchMatches}
                  searchExpanded={searchExpanded}
                  collapsedNodes={collapsedNodes}
                  toggleCollapsed={toggleCollapsed}
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
// DRAG OVERLAY CARD (follows cursor)
// ==========================================

function DragOverlayCard({ profile }: { profile: OrgChartProfile }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--yellow)] bg-white px-5 py-4 shadow-2xl w-[180px] scale-105 rotate-2">
      <Avatar profile={profile} />
      <p className="mt-2.5 text-center text-[12px] font-semibold text-[var(--heading)] leading-tight">
        {profile.first_name}{" "}
        <span className="uppercase">{profile.last_name}</span>
      </p>
      <p className="mt-0.5 text-center text-[10px] text-[var(--text-muted)] leading-tight">
        {profile.job_title || profile.department || "—"}
      </p>
    </div>
  );
}

// ==========================================
// LIST VIEW ROW (draggable)
// ==========================================

function ListRow({
  profile,
  depth,
  allProfiles,
  isAdmin,
  onManagerChange,
  activeId,
  tree,
}: {
  profile: OrgChartProfile;
  depth: number;
  allProfiles: OrgChartProfile[];
  isAdmin: boolean;
  onManagerChange: (userId: string, managerId: string | null) => void;
  activeId: string | null;
  tree: TreeNode[];
}) {
  const [editingManager, setEditingManager] = useState(false);

  const manager = profile.manager_id
    ? allProfiles.find((p) => p.id === profile.manager_id)
    : null;

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `list-${profile.id}`,
    data: { profileId: profile.id, type: "list" },
    disabled: !isAdmin,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `list-drop-${profile.id}`,
    data: { profileId: profile.id, type: "list" },
    disabled: !isAdmin,
  });

  const isValidTarget = useMemo(() => {
    if (!activeId || !isAdmin) return false;
    const draggedProfileId = activeId.replace("tree-", "").replace("list-", "");
    if (draggedProfileId === profile.id) return false;
    const draggedNode = findNodeById(tree, draggedProfileId);
    if (draggedNode) {
      const descendants = getDescendantIds(draggedNode);
      if (descendants.has(profile.id)) return false;
    }
    return true;
  }, [activeId, profile.id, tree, isAdmin]);

  const mergedRef = useCallback(
    (el: HTMLTableRowElement | null) => {
      setDragRef(el);
      setDropRef(el);
    },
    [setDragRef, setDropRef]
  );

  return (
    <tr
      ref={mergedRef}
      className={cn(
        "transition-all",
        isDragging && "opacity-30",
        isOver && isValidTarget && "bg-[var(--yellow-surface)]/40 ring-1 ring-[var(--yellow)]",
        isOver && !isValidTarget && "bg-red-50 ring-1 ring-red-200",
        !isOver && "hover:bg-[var(--hover)]"
      )}
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
          {isAdmin && (
            <span
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] mr-1"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          )}
          <Avatar profile={profile} size="sm" />
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
// LIST DRAG OVERLAY ROW
// ==========================================

function ListDragOverlayRow({ profile }: { profile: OrgChartProfile }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--yellow)] bg-white px-4 py-2.5 shadow-2xl">
      <Avatar profile={profile} size="sm" />
      <div>
        <p className="text-[13px] font-medium text-[var(--heading)]">
          {profile.first_name} {profile.last_name}
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">{profile.email}</p>
      </div>
    </div>
  );
}

// ==========================================
// ZOOM & PAN CONTAINER
// ==========================================

function ZoomPanContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Fit to screen on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && contentRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();

        if (contentRect.width > 0 && contentRect.height > 0) {
          const scaleX = (containerRect.width - 48) / contentRect.width;
          const scaleY = (containerRect.height - 48) / contentRect.height;
          const fitZoom = Math.min(scaleX, scaleY, 1);
          setZoom(Math.max(fitZoom, 0.2));
          setPan({ x: 0, y: 0 });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.002, 0.15), 2));
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on middle click or when clicking on the background
      if (e.button === 1 || (e.target as HTMLElement) === containerRef.current || (e.target as HTMLElement) === contentRef.current) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({
        x: panStart.current.panX + dx,
        y: panStart.current.panY + dy,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const fitToScreen = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      // Temporarily reset to measure true content size
      const prevZoom = zoom;
      const prevPan = pan;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setTimeout(() => {
        if (containerRef.current && contentRef.current) {
          const contentRect = contentRef.current.getBoundingClientRect();
          if (contentRect.width > 0 && contentRect.height > 0) {
            const scaleX = (containerRect.width - 48) / contentRect.width;
            const scaleY = (containerRect.height - 48) / contentRect.height;
            const fitZoom = Math.min(scaleX, scaleY, 1);
            setZoom(Math.max(fitZoom, 0.15));
            setPan({ x: 0, y: 0 });
          } else {
            setZoom(prevZoom);
            setPan(prevPan);
          }
        }
      }, 50);
    }
  }, [zoom, pan]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--hover)]",
        isPanning ? "cursor-grabbing" : "cursor-default"
      )}
      style={{ minHeight: "500px", height: "calc(100vh - 260px)" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Content */}
      <div
        ref={contentRef}
        className="inline-flex p-12 transition-transform origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {children}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-[var(--border-1)] bg-white p-1 shadow-sm">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
          className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]"
          title="Zoom +"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <span className="min-w-[40px] text-center text-[11px] font-medium text-[var(--text-muted)]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.15))}
          className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]"
          title="Zoom -"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="mx-0.5 h-4 w-px bg-[var(--border-1)]" />
        <button
          onClick={fitToScreen}
          className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]"
          title="Ajuster à l'écran"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Hint */}
      <div className="absolute top-3 left-3 text-[10px] text-[var(--text-muted)] opacity-60">
        Ctrl + molette pour zoomer · Cliquer-glisser pour déplacer
      </div>
    </div>
  );
}

// ==========================================
// ROOT DROP ZONE (for removing manager)
// ==========================================

function RootDropZone({ activeId }: { activeId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-drop",
    data: { profileId: null, type: "root" },
  });

  if (!activeId) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-4 flex items-center justify-center rounded-xl border-2 border-dashed px-6 py-3 transition-all",
        isOver
          ? "border-[var(--yellow)] bg-[var(--yellow-surface)]/30 text-[var(--heading)]"
          : "border-[var(--border-1)] text-[var(--text-muted)]"
      )}
    >
      <p className="text-[12px] font-medium">
        Déposer ici pour retirer le manager (mettre en racine)
      </p>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function OrgChart({ profiles, isAdmin }: OrgChartProps) {
  const [view, setView] = useState<"tree" | "list">("tree");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(profiles), [profiles]);

  // Search
  const { matches: searchMatches, expanded: searchExpanded } = useMemo(
    () => getSearchMatches(tree, search),
    [tree, search]
  );

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleManagerChange = useCallback(
    async (userId: string, managerId: string | null) => {
      const user = profiles.find((p) => p.id === userId);
      const manager = managerId ? profiles.find((p) => p.id === managerId) : null;
      const result = await updateManager(userId, managerId);
      if (result.success) {
        toast.success(
          manager
            ? `${user?.first_name} ${user?.last_name} → manager : ${manager.first_name} ${manager.last_name}`
            : `${user?.first_name} ${user?.last_name} → racine (sans manager)`
        );
      } else {
        toast.error(result.error || "Erreur");
      }
    },
    [profiles]
  );

  // DnD sensors (require 10px movement before starting drag to allow clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || !isAdmin) return;

      const draggedProfileId = (active.data.current as { profileId: string }).profileId;
      const overData = over.data.current as { profileId: string | null; type: string };

      // Root drop = remove manager
      if (overData.type === "root") {
        handleManagerChange(draggedProfileId, null);
        return;
      }

      const targetProfileId = overData.profileId;
      if (!targetProfileId || draggedProfileId === targetProfileId) return;

      // Check for cycles
      const draggedNode = findNodeById(tree, draggedProfileId);
      if (draggedNode) {
        const descendants = getDescendantIds(draggedNode);
        if (descendants.has(targetProfileId)) {
          toast.error("Impossible : cela créerait une boucle dans la hiérarchie");
          return;
        }
      }

      handleManagerChange(draggedProfileId, targetProfileId);
    },
    [isAdmin, tree, handleManagerChange]
  );

  // Get dragged profile for overlay
  const activeProfile = useMemo(() => {
    if (!activeId) return null;
    const profileId = activeId.replace("tree-", "").replace("list-", "");
    return profiles.find((p) => p.id === profileId) ?? null;
  }, [activeId, profiles]);

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

  const isTreeView = view === "tree";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

            {/* Search (both views) */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-52 rounded-lg border border-[var(--border-1)] bg-white pl-8 pr-3 text-xs text-[var(--heading)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--heading)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {search && isTreeView && searchMatches.size > 0 && (
              <span className="text-[11px] text-[var(--text-muted)]">
                {searchMatches.size} résultat{searchMatches.size > 1 ? "s" : ""}
              </span>
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

        {/* DnD hint for admin */}
        {isAdmin && (
          <RootDropZone activeId={activeId} />
        )}

        {/* Tree View */}
        {isTreeView && (
          <ZoomPanContainer>
            {tree.length === 0 ? (
              <div className="py-16 text-center w-full">
                <GitBranch className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Aucune hiérarchie définie
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                  Utilisez l&apos;import ou assignez des managers depuis la vue liste
                </p>
              </div>
            ) : (
              <div className="flex justify-center gap-8 items-start">
                {tree.map((rootNode) => (
                  <DraggableTreeCard
                    key={rootNode.profile.id}
                    node={rootNode}
                    isAdmin={isAdmin}
                    allProfiles={profiles}
                    tree={tree}
                    onManagerChange={handleManagerChange}
                    activeId={activeId}
                    search={search}
                    searchMatches={searchMatches}
                    searchExpanded={searchExpanded}
                    collapsedNodes={collapsedNodes}
                    toggleCollapsed={toggleCollapsed}
                  />
                ))}
              </div>
            )}
          </ZoomPanContainer>
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
                    activeId={activeId}
                    tree={tree}
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

        {/* DnD Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeProfile && (
            activeId?.startsWith("list-") ? (
              <ListDragOverlayRow profile={activeProfile} />
            ) : (
              <DragOverlayCard profile={activeProfile} />
            )
          )}
        </DragOverlay>

        {/* Import Modal */}
        {showImport && (
          <OrgChartImportModal
            open={showImport}
            onClose={() => setShowImport(false)}
            profiles={profiles}
          />
        )}
      </div>
    </DndContext>
  );
}
