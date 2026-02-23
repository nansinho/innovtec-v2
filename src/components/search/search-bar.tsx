"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Search, Newspaper, FileText, User, GraduationCap, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { globalSearch, type SearchResult } from "@/actions/search";

const categoryConfig: Record<
  SearchResult["category"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  actualite: {
    label: "Actualités",
    icon: Newspaper,
    color: "text-[var(--blue)]",
    bg: "bg-[var(--blue-surface)]",
  },
  document: {
    label: "Documents",
    icon: FileText,
    color: "text-[var(--green)]",
    bg: "bg-[var(--green-surface)]",
  },
  collaborateur: {
    label: "Collaborateurs",
    icon: User,
    color: "text-[var(--purple)]",
    bg: "bg-[var(--purple-surface)]",
  },
  formation: {
    label: "Formations",
    icon: GraduationCap,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  evenement: {
    label: "Événements",
    icon: Calendar,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearch(value);
        setResults(data);
        setIsOpen(true);
      });
    }, 300);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  // Group results by category
  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-4 py-2.5 transition-all focus-within:border-[var(--yellow)] focus-within:shadow-[0_0_0_3px_var(--yellow-surface)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Rechercher des fichiers, actualités, documents, collaborateurs..."
          className="w-full bg-transparent text-[13px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)]"
        />
        {query && (
          <button
            onClick={handleClear}
            className="shrink-0 rounded-full p-0.5 text-[var(--text-muted)] transition-colors hover:bg-gray-100 hover:text-[var(--heading)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => query.trim().length >= 2 && handleSearch(query)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--yellow)] transition-colors hover:bg-[var(--yellow-hover)]"
        >
          <Search className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[480px] overflow-y-auto rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-lg">
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--yellow)] border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-[var(--border-1)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Aucun résultat pour &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-1)]">
              {(Object.entries(grouped) as [SearchResult["category"], SearchResult[]][]).map(
                ([category, items]) => {
                  const config = categoryConfig[category];
                  const Icon = config.icon;

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 bg-[var(--hover)] px-4 py-2">
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          {config.label}
                        </span>
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-bold text-[var(--text-secondary)]">
                          {items.length}
                        </span>
                      </div>

                      {/* Items */}
                      {items.map((item) => (
                        <a
                          key={item.id}
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--yellow-surface)]"
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              config.bg
                            )}
                          >
                            <Icon
                              className={cn("h-3.5 w-3.5", config.color)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-medium text-[var(--heading)]">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="truncate text-[11px] text-[var(--text-muted)]">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* Footer */}
          {results.length > 0 && (
            <div className="border-t border-[var(--border-1)] bg-gray-50/50 px-4 py-2 text-center">
              <span className="text-[11px] text-[var(--text-muted)]">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé
                {results.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
