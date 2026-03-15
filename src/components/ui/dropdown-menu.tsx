"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface DropdownMenuProps {
  items: DropdownItem[];
  className?: string;
}

export function DropdownMenu({ items, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen((v) => !v);
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] transition-colors hover:bg-zinc-100 hover:text-[var(--text)]"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[201] min-w-[160px] rounded-[var(--radius)] border border-[var(--border-1)] bg-white py-1 shadow-md"
            style={{ top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    item.variant === "danger"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-[var(--text)] hover:bg-zinc-50"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
