"use client";

import { BookOpen, Clock, MapPin } from "lucide-react";
import { formatRelative } from "@/lib/utils";

interface RexItem {
  id: string;
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  created_at: string;
  author?: { first_name: string; last_name: string } | null;
}

interface RexListProps {
  rexList: RexItem[];
}

export default function RexList({ rexList }: RexListProps) {
  if (rexList.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          Aucun retour d&apos;expérience enregistré.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rexList.map((rex) => {
        const author = rex.author as unknown as {
          first_name: string;
          last_name: string;
        } | null;

        return (
          <div
            key={rex.id}
            className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-white p-5"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {rex.chantier && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-700">
                  <MapPin className="h-3 w-3" />
                  {rex.chantier}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Clock className="h-3 w-3" />
                {formatRelative(rex.created_at)}
              </span>
              {author && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  Par {author.first_name} {author.last_name}
                </span>
              )}
            </div>

            <h3 className="mb-2 text-[14px] font-semibold text-[var(--heading)]">
              {rex.title}
            </h3>

            <p className="mb-3 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
              {rex.description}
            </p>

            {rex.lessons_learned && (
              <div className="rounded-[var(--radius-xs)] border-l-4 border-l-[var(--yellow)] bg-[var(--yellow-surface)] p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--yellow)]">
                  Leçons tirées
                </p>
                <p className="text-[12px] leading-relaxed text-[var(--text)]">
                  {rex.lessons_learned}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
