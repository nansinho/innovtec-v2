"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Search, Newspaper, FileText, User, GraduationCap, Calendar, X, Shield, AlertCircle, Eye } from "lucide-react";
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
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  document: {
    label: "Documents",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  collaborateur: {
    label: "Collaborateurs",
    icon: User,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  formation: {
    label: "Formations",
    icon: GraduationCap,
    color: "text-orange-500",
    bg: "bg-orange-500/[0.06]",
  },
  evenement: {
    label: "Événements",
    icon: Calendar,
    color: "text-indigo-500",
    bg: "bg-indigo-500/[0.06]",
  },
  qse: {
    label: "Politique QSE",
    icon: Shield,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  danger: {
    label: "Situations dangereuses",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  rex: {
    label: "Fiches REX",
    icon: Eye,
    color: "text-gray-900",
    bg: "bg-gray-900/[0.06]",
  },
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    inputRef.current?.focus();
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
      {/* Search input — Apple style */}
      <div className={cn(
        "flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-300",
        "bg-black/[0.04] bg-gray-100",
        "hover:bg-black/[0.06]",
        isOpen || query
          ? "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]"
          : ""
      )}>
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Rechercher..."
          className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        {(query || isPending) && (
          <div className="flex items-center gap-1.5">
            {isPending && (
              <div className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-gray-400 border-t-transparent" />
            )}
            {query && (
              <button
                onClick={handleClear}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/[0.08] text-gray-400 transition-colors hover:bg-black/[0.14] hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results dropdown — Apple style */}
      {isOpen && (
        <div className="animate-slide-down absolute left-0 right-0 top-full z-50 mt-2 max-h-[480px] overflow-y-auto rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] bg-white">
          {results.length === 0 ? (
            <div className="py-10 text-center">
              <Search className="mx-auto mb-2.5 h-8 w-8 text-gray-400 opacity-40" />
              <p className="text-sm text-gray-500">
                Aucun résultat pour &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="py-1.5">
              {(Object.entries(grouped) as [SearchResult["category"], SearchResult[]][]).map(
                ([category, items]) => {
                  const config = categoryConfig[category];
                  const Icon = config.icon;

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {config.label}
                        </span>
                        <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-gray-400">
                          {items.length}
                        </span>
                      </div>

                      {/* Items */}
                      {items.map((item) => (
                        <a
                          key={item.id}
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="mx-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-black/[0.04] active:scale-[0.99]"
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                              config.bg
                            )}
                          >
                            <Icon
                              className={cn("h-4 w-4", config.color)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-gray-900">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="truncate text-[11px] text-gray-400">
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
            <div className="border-t border-black/[0.04] px-4 py-2 text-center">
              <span className="text-[11px] text-gray-400">
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
