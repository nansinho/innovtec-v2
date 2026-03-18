"use client";

import { Cake } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import type { Profile } from "@/lib/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UpcomingBirthdaysProps {
  birthdays: Profile[];
}

export default function UpcomingBirthdays({ birthdays }: UpcomingBirthdaysProps) {
  if (birthdays.length === 0) {
    return (
      <Card>
        <CardHeader title="Anniversaires à venir" icon={Cake} />
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Aucun anniversaire dans les 30 prochains jours
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Anniversaires à venir" icon={Cake} />
      <div className="divide-y divide-[var(--border-1)]">
        {birthdays.map((person) => {
          const initials =
            `${person.first_name?.[0] ?? ""}${person.last_name?.[0] ?? ""}`.toUpperCase() || "?";

          const dob = new Date(person.date_of_birth!);
          const now = new Date();
          const thisYearBirthday = new Date(
            now.getFullYear(),
            dob.getMonth(),
            dob.getDate()
          );
          if (thisYearBirthday < now) {
            thisYearBirthday.setFullYear(now.getFullYear() + 1);
          }
          const diffDays = Math.ceil(
            (thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const dateStr = format(thisYearBirthday, "d MMMM", { locale: fr });

          return (
            <div key={person.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--heading)]">
                  {person.first_name} {person.last_name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {person.job_title || "Collaborateur"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-medium text-pink-600">{dateStr}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {diffDays === 1 ? "Demain" : `Dans ${diffDays} jours`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
