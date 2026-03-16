"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";

type ViewMode = "day" | "week" | "month";

interface EventItem {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  color: string;
  location?: string;
}

const colorClasses: Record<string, string> = {
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

interface PlanningViewProps {
  events: EventItem[];
}

export default function PlanningView({ events }: PlanningViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7;

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.start_at), day));
  }

  const selectedDayEvents = useMemo(
    () => getEventsForDay(selectedDay),
    [selectedDay, events]
  );

  function navigate(dir: "prev" | "next") {
    if (view === "week") {
      setCurrentDate(dir === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(dir === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(dir === "next" ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  }

  const headerLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy", { locale: fr })
      : view === "week"
      ? `${format(weekStart, "d MMM", { locale: fr })} — ${format(weekEnd, "d MMM yyyy", { locale: fr })}`
      : format(currentDate, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="flex gap-5">
      {/* Main calendar */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("next")}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50"
              aria-label="Suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-2 text-lg font-semibold capitalize text-gray-900">
              {headerLabel}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex rounded-xl border border-gray-200 bg-white">
              {(["day", "week", "month"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    view === v
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-50",
                    v === "day" && "rounded-l-xl",
                    v === "month" && "rounded-r-xl"
                  )}
                >
                  {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
                </button>
              ))}
            </div>
            <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-medium text-white transition-colors hover:bg-orange-700">
              <Plus className="h-4 w-4" />
              Nouveau
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {view === "week" && (
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "flex min-h-[120px] flex-col border-r border-b border-gray-200 p-2 text-left last:border-r-0 transition-colors",
                      isSelected && "bg-amber-50/50",
                      !isSelected && "hover:bg-gray-50"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase text-gray-400">
                        {format(day, "EEE", { locale: fr })}
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          isToday
                            ? "bg-orange-600 font-semibold text-white"
                            : "text-gray-900"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          className={cn(
                            "truncate rounded-lg border px-1.5 py-0.5 text-[10px] font-medium",
                            colorClasses[evt.color] ?? colorClasses.blue
                          )}
                        >
                          {format(new Date(evt.start_at), "HH:mm")} {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-400">
                          +{dayEvents.length - 3} de plus
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {view === "month" && (
            <>
              <div className="grid grid-cols-7 border-b border-gray-200">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-medium text-gray-400">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-200" />
                ))}
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDay(day); setView("week"); }}
                      className="flex min-h-[80px] flex-col border-r border-b border-gray-200 p-1.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <span
                        className={cn(
                          "mb-1 flex h-5 w-5 items-center justify-center self-end rounded-full text-[11px]",
                          isToday
                            ? "bg-orange-600 font-semibold text-white"
                            : "text-gray-500"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={cn(
                            "mb-0.5 truncate rounded-lg px-1 py-0.5 text-[9px] font-medium",
                            colorClasses[evt.color] ?? colorClasses.blue
                          )}
                        >
                          {evt.title}
                        </div>
                      ))}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "day" && (
            <div className="p-4">
              {getEventsForDay(currentDate).length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <CalendarDays className="mb-2 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    Aucun événement ce jour
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getEventsForDay(currentDate).map((evt) => (
                    <div
                      key={evt.id}
                      className={cn(
                        "rounded-xl border p-3",
                        colorClasses[evt.color] ?? colorClasses.blue
                      )}
                    >
                      <div className="text-sm font-medium">{evt.title}</div>
                      <div className="mt-1 text-xs opacity-70">
                        {format(new Date(evt.start_at), "HH:mm", { locale: fr })}
                        {evt.end_at && ` — ${format(new Date(evt.end_at), "HH:mm", { locale: fr })}`}
                        {evt.location && ` · ${evt.location}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar — selected day events */}
      <div className="hidden w-[280px] shrink-0 lg:block">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold capitalize text-gray-900">
              {format(selectedDay, "EEEE d MMMM", { locale: fr })}
            </h3>
          </div>
          <div className="p-3">
            {selectedDayEvents.length === 0 ? (
              <div className="py-6 text-center">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-xs text-gray-400">Aucun événement</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-xl border border-gray-200 p-3"
                  >
                    <div className="mb-1 text-xs text-gray-400">
                      {format(new Date(evt.start_at), "HH:mm", { locale: fr })}
                      {evt.end_at && ` — ${format(new Date(evt.end_at), "HH:mm", { locale: fr })}`}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {evt.title}
                    </div>
                    {evt.location && (
                      <div className="mt-1 text-xs text-gray-400">
                        {evt.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
