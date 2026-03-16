"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  id: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  onAdd?: (label: string) => Promise<SelectOption | null>;
  onDelete?: (id: string) => Promise<boolean>;
  addLabel?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  onAdd,
  onDelete,
  addLabel = "Ajouter",
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openAbove: false });

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

    setPos({
      top: openAbove ? 0 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openAbove,
    });
  }, []);

  // Reposition after render to measure actual dropdown height
  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight;

    if (pos.openAbove) {
      setPos((prev) => ({ ...prev, top: rect.top - dropdownHeight - 4 }));
    } else {
      setPos((prev) => ({ ...prev, top: rect.bottom + 4 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtered.length, adding, pos.openAbove]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setSearch("");
      setAdding(false);
      setNewValue("");
    }

    function handleScroll() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);

    // Focus search on open
    setTimeout(() => searchRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (adding) {
      setTimeout(() => addInputRef.current?.focus(), 50);
    }
  }, [adding]);

  const selectedLabel = options.find((o) => o.label === value)?.label || value;

  async function handleAdd() {
    if (!newValue.trim() || !onAdd) return;
    setLoading(true);
    const result = await onAdd(newValue.trim());
    setLoading(false);
    if (result) {
      onChange(result.label);
      setNewValue("");
      setAdding(false);
      setSearch("");
    }
  }

  async function handleDelete(e: React.MouseEvent, option: SelectOption) {
    e.stopPropagation();
    if (!onDelete) return;
    setLoading(true);
    const success = await onDelete(option.id);
    setLoading(false);
    if (success && value === option.label) {
      onChange("");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            if (open) {
              setSearch("");
              setAdding(false);
              setNewValue("");
            }
          }
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm outline-none transition-all",
          "hover:border-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
          value ? "text-gray-900" : "text-gray-400",
          disabled && "cursor-not-allowed opacity-50",
          open && "border-orange-500 ring-2 ring-orange-500/20",
          className
        )}
      >
        <span className="truncate">{value ? selectedLabel : placeholder}</span>
        <ChevronDown
          className={cn(
            "ml-1 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[300] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.04]"
            style={{
              top: pos.top,
              left: pos.left,
              width: Math.max(pos.width, 220),
            }}
          >
            {/* Search */}
            <div className="border-b border-gray-200 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full rounded-lg bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-900 outline-none placeholder:text-gray-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-[180px] overflow-y-auto p-1">
              {/* Empty option */}
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition-colors",
                  !value
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-400 hover:bg-gray-50"
                )}
              >
                Aucun
              </button>

              {filtered.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "group flex items-center rounded-lg transition-colors",
                    value === option.label
                      ? "bg-orange-50"
                      : "hover:bg-gray-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.label);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex flex-1 items-center px-3 py-2 text-left text-xs",
                      value === option.label
                        ? "font-medium text-orange-600"
                        : "text-gray-900"
                    )}
                  >
                    {option.label}
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, option)}
                      disabled={loading}
                      className="mr-1 rounded-md p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              {filtered.length === 0 && search && (
                <div className="px-3 py-4 text-center text-xs text-gray-400">
                  Aucun résultat pour « {search} »
                </div>
              )}
            </div>

            {/* Add new */}
            {onAdd && (
              <div className="border-t border-gray-200 p-2">
                {adding ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={addInputRef}
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAdd();
                        }
                        if (e.key === "Escape") {
                          setAdding(false);
                          setNewValue("");
                        }
                      }}
                      placeholder={`${addLabel}...`}
                      disabled={loading}
                      className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={loading || !newValue.trim()}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white transition-all hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(false);
                        setNewValue("");
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {addLabel}
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
