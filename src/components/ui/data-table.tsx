"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
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

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField: keyof T;
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

  /* Loading */
  if (loading) {
    return (
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white">
        <DataTableSkeleton columns={columns.length} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border-1)] px-4 py-3">
        {/* Search */}
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
              className="h-9 w-64 rounded-[var(--radius)] border border-zinc-300 bg-white pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
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

        {/* Filters */}
        {filters?.map((f) => (
          <div key={f.key}>
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
                className="h-9 rounded-[var(--radius)] border border-zinc-300 bg-white px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              >
                <option value="">{f.placeholder ?? f.label}</option>
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
                className="h-9 rounded-[var(--radius)] border border-zinc-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
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
                className="h-9 rounded-[var(--radius)] border border-zinc-300 bg-white px-3 text-sm outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            )}
          </div>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {headerAction}
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius)] bg-[var(--yellow)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
            >
              <Plus className="h-4 w-4" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Batch actions bar */}
      {selectable && selectedIds.size > 0 && batchActions && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-1)] bg-zinc-50/80">
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
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]",
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
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => {
              const id = item[keyField];
              const isSelected = selectedIds.has(id);
              return (
                <tr
                  key={String(id)}
                  className={cn(
                    "border-b border-[var(--border-1)] transition-colors last:border-0",
                    isSelected ? "bg-amber-50/50" : "hover:bg-zinc-50",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <td className="px-4 py-3">
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
                      className="px-4 py-3 text-sm text-[var(--text)]"
                    >
                      {col.render
                        ? col.render(item)
                        : String(
                            (item as Record<string, unknown>)[col.key] ?? ""
                          )}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <DropdownMenu items={actions(item)} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && emptyState && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <emptyState.icon className="mb-3 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-sm font-medium text-[var(--heading)]">
            {emptyState.title}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {emptyState.description}
          </p>
        </div>
      )}

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--border-1)] px-4 py-3">
          <span className="text-sm text-[var(--text-muted)]">
            Affichage {rangeStart}–{rangeEnd} sur {sorted.length} résultat
            {sorted.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border-1)] text-[var(--text-muted)] transition-colors hover:bg-zinc-50 disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-[var(--text-secondary)]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border-1)] text-[var(--text-muted)] transition-colors hover:bg-zinc-50 disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
