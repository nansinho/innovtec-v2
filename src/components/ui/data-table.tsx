"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, type DropdownItem } from "./dropdown-menu";
import { DataTableSkeleton } from "./skeleton";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => React.ReactNode;
  accessor?: (item: T) => string | number;
}

export interface FilterDef {
  key: string;
  label: string;
  type: "select" | "input" | "date";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface EmptyStateDef {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface ToolbarAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField: keyof T;
  title?: string;
  description?: string;
  toolbarActions?: ToolbarAction[];
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  selectable?: boolean;
  actions?: (item: T) => DropdownItem[];
  batchActions?: { label: string; onClick: (ids: T[keyof T][]) => void; variant?: "default" | "danger" }[];
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
  emptyState?: EmptyStateDef;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  headerAction?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
  data,
  columns,
  keyField,
  title,
  description,
  toolbarActions,
  searchable = false,
  searchPlaceholder = "Rechercher...",
  filters,
  selectable = false,
  actions,
  batchActions,
  onAdd,
  addLabel = "Ajouter",
  pageSize = 20,
  emptyState,
  loading = false,
  onRowClick,
  headerAction,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<T[keyof T]>>(new Set());
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  /* Close filter popover on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    if (filtersOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [filtersOpen]);

  /* Search + Filter */
  const filtered = useMemo(() => {
    let result = data;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        columns.some((col) => {
          const val = col.accessor
            ? col.accessor(item)
            : (item as Record<string, unknown>)[col.key];
          return String(val ?? "").toLowerCase().includes(q);
        })
      );
    }

    if (filters) {
      for (const f of filters) {
        const val = filterValues[f.key];
        if (val) {
          result = result.filter((item) => {
            const itemVal = (item as Record<string, unknown>)[f.key];
            return String(itemVal ?? "").toLowerCase() === val.toLowerCase();
          });
        }
      }
    }

    return result;
  }, [data, search, filterValues, columns, filters]);

  /* Sort */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = col.accessor
        ? col.accessor(a)
        : (a as Record<string, unknown>)[col.key];
      const bVal = col.accessor
        ? col.accessor(b)
        : (b as Record<string, unknown>)[col.key];
      const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), "fr", {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const rangeStart = sorted.length ? page * pageSize + 1 : 0;
  const rangeEnd = Math.min((page + 1) * pageSize, sorted.length);

  /* Selection */
  const allPageSelected =
    paged.length > 0 && paged.every((item) => selectedIds.has(item[keyField]));

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paged.forEach((item) => next.delete(item[keyField]));
      } else {
        paged.forEach((item) => next.add(item[keyField]));
      }
      return next;
    });
  }, [allPageSelected, paged, keyField]);

  const toggleOne = useCallback(
    (id: T[keyof T]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const activeFilterCount = filters
    ? Object.values(filterValues).filter(Boolean).length
    : 0;

  /* Loading */
  if (loading) {
    return <DataTableSkeleton columns={columns.length} />;
  }

  /* Pagination numbers */
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push("...");
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const hasToolbar = searchable || (filters && filters.length > 0) || headerAction;

  return (
    <div>
      {/* ============ ROW 1: Page header ============ */}
      {title && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--heading)]">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {toolbarActions?.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border-1)] bg-white px-3 text-sm font-medium text-[var(--text-secondary)] shadow-xs transition-all hover:bg-zinc-50 hover:text-[var(--heading)] hover:border-zinc-300 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              );
            })}
            {headerAction}
            {onAdd && (
              <button
                onClick={onAdd}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 px-4 text-sm font-medium text-white shadow-sm shadow-amber-600/20 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-md hover:shadow-amber-600/25 active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                {addLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ ROW 2: Search + Filters button ============ */}
      {hasToolbar && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-72 rounded-lg border border-[var(--border-1)] bg-white pl-10 pr-8 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {filters && filters.length > 0 && (
            <div ref={filtersRef} className="relative">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all",
                  activeFilterCount > 0
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-[var(--border-1)] bg-white text-[var(--text-secondary)] hover:bg-zinc-50 hover:text-[var(--heading)]"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filters popover */}
              {filtersOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--border-1)] bg-white p-4 shadow-lg ring-1 ring-black/[0.04]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Filtres</span>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => {
                          setFilterValues({});
                          setPage(0);
                        }}
                        className="text-xs font-medium text-amber-600 hover:text-amber-800"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {filters.map((f) => (
                      <div key={f.key}>
                        <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                          {f.label}
                        </label>
                        {f.type === "select" && f.options && (
                          <select
                            value={filterValues[f.key] ?? ""}
                            onChange={(e) => {
                              setFilterValues((prev) => ({
                                ...prev,
                                [f.key]: e.target.value,
                              }));
                              setPage(0);
                            }}
                            className="h-9 w-full rounded-lg border border-[var(--border-1)] bg-white px-3 text-sm text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                          >
                            <option value="">{f.placeholder ?? `Tous`}</option>
                            {f.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {f.type === "input" && (
                          <input
                            value={filterValues[f.key] ?? ""}
                            onChange={(e) => {
                              setFilterValues((prev) => ({
                                ...prev,
                                [f.key]: e.target.value,
                              }));
                              setPage(0);
                            }}
                            placeholder={f.placeholder ?? f.label}
                            className="h-9 w-full rounded-lg border border-[var(--border-1)] bg-white px-3 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                          />
                        )}
                        {f.type === "date" && (
                          <input
                            type="date"
                            value={filterValues[f.key] ?? ""}
                            onChange={(e) => {
                              setFilterValues((prev) => ({
                                ...prev,
                                [f.key]: e.target.value,
                              }));
                              setPage(0);
                            }}
                            className="h-9 w-full rounded-lg border border-[var(--border-1)] bg-white px-3 text-sm outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ Batch actions bar ============ */}
      {selectable && selectedIds.size > 0 && batchActions && (
        <div className="mb-0.5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-amber-800">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <span className="text-amber-300">—</span>
          {batchActions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.onClick(Array.from(selectedIds))}
              className={cn(
                "font-medium transition-colors",
                action.variant === "danger"
                  ? "text-red-600 hover:text-red-800"
                  : "text-[var(--navy)] hover:text-[var(--navy-dark)]"
              )}
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-amber-500 hover:text-amber-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ============ TABLE ============ */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-2)] bg-[var(--hover)]">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-zinc-300 accent-[var(--yellow)]"
                    aria-label="Sélectionner tout"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--text)]"
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="w-14 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-1)]">
            {paged.map((item) => {
              const id = item[keyField];
              const isSelected = selectedIds.has(id);
              return (
                <tr
                  key={String(id)}
                  className={cn(
                    "transition-colors duration-150",
                    isSelected
                      ? "bg-amber-50/60"
                      : "hover:bg-[var(--hover)]",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleOne(id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-zinc-300 accent-[var(--yellow)]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3.5 text-sm text-[var(--text)]"
                    >
                      {col.render
                        ? col.render(item)
                        : String(
                            (item as Record<string, unknown>)[col.key] ?? ""
                          )}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3.5 text-right">
                      <DropdownMenu items={actions(item)} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ============ Empty state ============ */}
      {sorted.length === 0 && emptyState && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 ring-1 ring-zinc-200/60">
            <emptyState.icon className="h-7 w-7 text-zinc-400" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-[var(--heading)]">
            {emptyState.title}
          </h3>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            {emptyState.description}
          </p>
        </div>
      )}

      {/* ============ Pagination ============ */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--border-1)] px-4 py-3">
          <span className="text-xs text-[var(--text-muted)]">
            {rangeStart}–{rangeEnd} sur {sorted.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-zinc-100 disabled:opacity-30"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-[var(--text-muted)]">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                      page === p
                        ? "bg-[var(--yellow)] text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-zinc-100"
                    )}
                  >
                    {(p as number) + 1}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-zinc-100 disabled:opacity-30"
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
      </div>{/* end card wrapper */}
    </div>
  );
}
