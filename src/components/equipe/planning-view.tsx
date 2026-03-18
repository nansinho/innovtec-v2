"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Calendar,
  Cake,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface BirthdayPerson {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  avatar_url?: string;
}

const colorClasses: Record<string, string> = {
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

const kpiCards = [
  {
    key: "reunions",
    label: "Réunions du jour",
    icon: Calendar,
    color: "text-purple-500",
    bg: "bg-purple-500/[0.06]",
    accent: "bg-purple-500",
  },
  {
    key: "anniversaires",
    label: "Anniversaires à venir",
    icon: Cake,
    color: "text-pink-500",
    bg: "bg-pink-500/[0.06]",
    accent: "bg-pink-500",
  },
  {
    key: "evenements",
    label: "Événements à venir",
    icon: CalendarDays,
    color: "text-blue-500",
    bg: "bg-blue-500/[0.06]",
    accent: "bg-blue-500",
  },
];

interface PlanningViewProps {
  events: EventItem[];
  todayEventsCount: number;
  upcomingEventsCount: number;
  todayBirthdays: BirthdayPerson[];
  upcomingBirthdays: BirthdayPerson[];
}

export default function PlanningView({
  events,
  todayEventsCount,
  upcomingEventsCount,
  todayBirthdays,
  upcomingBirthdays,
}: PlanningViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStartDate = startOfMonth(currentDate);
  const monthEndDate = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });
  const firstDayOfWeek = (getDay(monthStartDate) + 6) % 7;

  // All birthdays mapped to current calendar month/year
  const allBirthdays = [...todayBirthdays, ...upcomingBirthdays];

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.start_at), day));
  }

  function getBirthdaysForDay(day: Date) {
    return allBirthdays.filter((p) => {
      const dob = new Date(p.date_of_birth);
      return dob.getMonth() === day.getMonth() && dob.getDate() === day.getDate();
    });
  }

  const selectedDayEvents = useMemo(
    () => getEventsForDay(selectedDay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDay, events]
  );

  const selectedDayBirthdays = useMemo(
    () => getBirthdaysForDay(selectedDay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDay, allBirthdays]
  );

  const kpiValues: Record<string, number> = {
    reunions: todayEventsCount,
    anniversaires: upcomingBirthdays.length,
    evenements: upcomingEventsCount,
  };

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
    <div>
      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              className={`animate-slide-up stagger-${i + 1} relative overflow-hidden rounded-xl bg-white/92 p-6 border border-[var(--border-1)] shadow-sm backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:scale-[1.01]`}
            >
              <div className={`absolute inset-x-0 top-0 h-[2px] ${kpi.accent} opacity-60`} />
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}
                >
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-[var(--heading)]">
                    {kpiValues[kpi.key] ?? 0}
                  </div>
                  <div className="text-xs font-medium text-[var(--text-muted)]">
                    {kpi.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* Main calendar */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDay(new Date());
                }}
                className="rounded-[var(--radius)] border border-[var(--border-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-zinc-50"
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={() => navigate("prev")}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border-1)] text-[var(--text-muted)] hover:bg-zinc-50"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("next")}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border-1)] text-[var(--text-muted)] hover:bg-zinc-50"
                aria-label="Suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <h2 className="ml-2 text-lg font-semibold capitalize text-[var(--heading)]">
                {headerLabel}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* View switcher */}
              <div className="flex rounded-[var(--radius)] border border-[var(--border-1)] bg-white">
                {(["day", "week", "month"] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      view === v
                        ? "bg-[var(--navy)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-zinc-50",
                      v === "day" && "rounded-l-[var(--radius)]",
                      v === "month" && "rounded-r-[var(--radius)]"
                    )}
                  >
                    {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={() => {}}>
                <Plus className="h-3.5 w-3.5" />
                Nouveau
              </Button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-xs">
            {view === "week" && (
              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const dayBirthdays = getBirthdaysForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDay);
                  const allItems = dayEvents.length + dayBirthdays.length;
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex min-h-[120px] flex-col border-r border-b border-[var(--border-1)] p-2 text-left last:border-r-0 transition-colors",
                        isSelected && "bg-amber-50/50",
                        !isSelected && "hover:bg-zinc-50"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase text-[var(--text-muted)]">
                          {format(day, "EEE", { locale: fr })}
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                            isToday
                              ? "bg-[var(--yellow)] font-semibold text-white"
                              : "text-[var(--heading)]"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayBirthdays.slice(0, 1).map((p) => (
                          <div
                            key={p.id}
                            className="truncate rounded-[var(--radius-xs)] border border-pink-200 bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-800"
                          >
                            <Cake className="mr-0.5 inline h-2.5 w-2.5" />
                            {p.first_name} {p.last_name}
                          </div>
                        ))}
                        {dayEvents.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className={cn(
                              "truncate rounded-[var(--radius-xs)] border px-1.5 py-0.5 text-[10px] font-medium",
                              colorClasses[evt.color] ?? colorClasses.blue
                            )}
                          >
                            {format(new Date(evt.start_at), "HH:mm")} {evt.title}
                          </div>
                        ))}
                        {allItems > 3 && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            +{allItems - 3} de plus
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
                <div className="grid grid-cols-7 border-b border-[var(--border-1)]">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                    <div
                      key={d}
                      className="px-2 py-2 text-center text-xs font-medium text-[var(--text-muted)]"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[90px] border-r border-b border-[var(--border-1)]"
                    />
                  ))}
                  {monthDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const dayBirthdays = getBirthdaysForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDay);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          "flex min-h-[90px] flex-col border-r border-b border-[var(--border-1)] p-1.5 text-left transition-colors",
                          isSelected && "bg-amber-50/50",
                          !isSelected && "hover:bg-zinc-50"
                        )}
                      >
                        <span
                          className={cn(
                            "mb-1 flex h-5 w-5 items-center justify-center self-end rounded-full text-[11px]",
                            isToday
                              ? "bg-[var(--yellow)] font-semibold text-white"
                              : "text-[var(--text-secondary)]"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayBirthdays.slice(0, 1).map((p) => (
                          <div
                            key={p.id}
                            className="mb-0.5 truncate rounded-[var(--radius-xs)] border border-pink-200 bg-pink-50 px-1 py-0.5 text-[9px] font-medium text-pink-700"
                          >
                            <Cake className="mr-0.5 inline h-2.5 w-2.5" />
                            {p.first_name}
                          </div>
                        ))}
                        {dayEvents.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            className={cn(
                              "mb-0.5 truncate rounded-[var(--radius-xs)] px-1 py-0.5 text-[9px] font-medium",
                              colorClasses[evt.color] ?? colorClasses.blue
                            )}
                          >
                            {evt.title}
                          </div>
                        ))}
                        {dayBirthdays.length + dayEvents.length > 3 && (
                          <span className="text-[9px] text-[var(--text-muted)]">
                            +{dayBirthdays.length + dayEvents.length - 3}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === "day" && (
              <div className="p-4">
                {getEventsForDay(currentDate).length === 0 &&
                getBirthdaysForDay(currentDate).length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <CalendarDays className="mb-2 h-10 w-10 text-zinc-300" />
                    <p className="text-sm text-[var(--text-muted)]">
                      Aucun événement ce jour
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getBirthdaysForDay(currentDate).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-[var(--radius)] border border-pink-200 bg-pink-50 p-3"
                      >
                        <Cake className="h-4 w-4 text-pink-500" />
                        <div>
                          <div className="text-sm font-medium text-pink-800">
                            Anniversaire de {p.first_name} {p.last_name}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getEventsForDay(currentDate).map((evt) => (
                      <div
                        key={evt.id}
                        className={cn(
                          "rounded-[var(--radius)] border p-3",
                          colorClasses[evt.color] ?? colorClasses.blue
                        )}
                      >
                        <div className="text-sm font-medium">{evt.title}</div>
                        <div className="mt-1 text-xs opacity-70">
                          {format(new Date(evt.start_at), "HH:mm", { locale: fr })}
                          {evt.end_at &&
                            ` — ${format(new Date(evt.end_at), "HH:mm", { locale: fr })}`}
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

        {/* Right sidebar — selected day details */}
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-xs">
            <div className="border-b border-[var(--border-1)] px-4 py-3">
              <h3 className="text-sm font-semibold capitalize text-[var(--heading)]">
                {format(selectedDay, "EEEE d MMMM", { locale: fr })}
              </h3>
            </div>
            <div className="p-3">
              {selectedDayEvents.length === 0 && selectedDayBirthdays.length === 0 ? (
                <div className="py-6 text-center">
                  <CalendarDays className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                  <p className="text-xs text-[var(--text-muted)]">Aucun événement</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Birthdays */}
                  {selectedDayBirthdays.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-pink-500">
                        <Cake className="h-3 w-3" />
                        Anniversaires
                      </div>
                      <div className="space-y-2">
                        {selectedDayBirthdays.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-[var(--radius)] border border-pink-200 bg-pink-50 p-3"
                          >
                            <div className="text-sm font-medium text-pink-800">
                              {p.first_name} {p.last_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {selectedDayEvents.length > 0 && (
                    <div>
                      {selectedDayBirthdays.length > 0 && (
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          <Calendar className="h-3 w-3" />
                          Événements
                        </div>
                      )}
                      <div className="space-y-2">
                        {selectedDayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="rounded-[var(--radius)] border border-[var(--border-1)] p-3"
                          >
                            <div className="mb-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <Clock className="h-3 w-3" />
                              {format(new Date(evt.start_at), "HH:mm", { locale: fr })}
                              {evt.end_at &&
                                ` — ${format(new Date(evt.end_at), "HH:mm", { locale: fr })}`}
                            </div>
                            <div className="text-sm font-medium text-[var(--heading)]">
                              {evt.title}
                            </div>
                            {evt.location && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                <MapPin className="h-3 w-3" />
                                {evt.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
