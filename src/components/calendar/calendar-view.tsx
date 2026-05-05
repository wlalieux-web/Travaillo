"use client";

import * as React from "react";
import { formatDateRange } from "little-date";
import { PlusIcon, CalendarDays, User, MapPin, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card-shadcn";
import { VisitStatusBadge } from "@/components/jobs/job-status-badge";
import { useRouter } from "next/navigation";
import type { VisitWithRelations } from "@/lib/jobs/types";

interface Props {
  visits: VisitWithRelations[];
}

function clientName(v: VisitWithRelations) {
  const c = v.jobs?.clients;
  if (!c) return "Client inconnu";
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Client";
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const STATUS_COLOR: Record<string, string> = {
  scheduled:   "after:bg-blue-400/70",
  en_route:    "after:bg-violet-400/70",
  in_progress: "after:bg-amber-400/70",
  completed:   "after:bg-emerald-400/70",
  cancelled:   "after:bg-rose-400/70",
  rescheduled: "after:bg-cyan-400/70",
  no_show:     "after:bg-orange-400/70",
};

export function CalendarView({ visits }: Props) {
  const router = useRouter();
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Dates qui ont des visites (pour les dots sur le calendrier)
  const visitDates = visits.map((v) => new Date(v.scheduled_start));

  // Visites du jour sélectionné
  const dayVisits = date
    ? visits.filter((v) => isSameDay(new Date(v.scheduled_start), date))
    : [];

  // Modifieurs pour les dots
  const modifiers = {
    hasVisit: visitDates,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Calendrier principal */}
      <Card className="w-full lg:w-auto lg:min-w-[400px] bg-white/[0.03] border-emerald-900/25 text-white py-4 [--primary:theme(colors.emerald.500)] [--primary-foreground:#fff] [--accent:theme(colors.emerald.950)] [--accent-foreground:theme(colors.white)] [--muted-foreground:rgba(255,255,255,0.35)] [--foreground:theme(colors.white)] [--ring:theme(colors.emerald.500)] [--background:transparent] [--card:transparent] [--card-foreground:theme(colors.white)] [--muted:rgba(255,255,255,0.06)]">
        <CardContent className="px-5">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="bg-transparent p-0 w-full"
            required
            modifiers={modifiers}
            modifiersClassNames={{
              hasVisit: "font-bold [&>button]:ring-2 [&>button]:ring-emerald-500/40",
            }}
          />
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-3 border-t border-emerald-900/20 px-5 !pt-4">
          {/* En-tête du jour */}
          <div className="flex w-full items-center justify-between px-1">
            <div className="text-sm font-medium text-white/80">
              {date?.toLocaleDateString("fr-CA", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10"
              title="Nouveau job ce jour"
              onClick={() => router.push(`/jobs/new`)}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">Nouveau job</span>
            </Button>
          </div>

          {/* Visites du jour */}
          <div className="flex w-full flex-col gap-2">
            {dayVisits.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-white/25">
                <CalendarDays className="h-8 w-8" />
                <p className="text-xs text-center">Aucune visite ce jour.</p>
                <button
                  onClick={() => router.push("/jobs/new")}
                  className="text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors"
                >
                  + Planifier un job
                </button>
              </div>
            ) : (
              dayVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => visit.jobs && router.push(`/jobs/${visit.job_id}`)}
                  className={`relative rounded-md bg-white/[0.04] p-2.5 pl-6 text-sm cursor-pointer hover:bg-white/[0.07] transition-colors after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full ${STATUS_COLOR[visit.status] ?? "after:bg-emerald-400/70"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-white/80 text-xs truncate">
                        {visit.jobs?.title ?? "Job sans titre"}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">
                        {formatDateRange(
                          new Date(visit.scheduled_start),
                          new Date(visit.scheduled_end)
                        )}
                      </div>
                      {clientName(visit) !== "Client inconnu" && (
                        <div className="text-white/30 text-[11px] mt-0.5 flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />
                          {clientName(visit)}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <VisitStatusBadge status={visit.status} />
                    </div>
                  </div>

                  {/* Techniciens assignés */}
                  {(visit.visit_assignments?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {visit.visit_assignments!.slice(0, 3).map((a) => (
                        <div
                          key={a.profile_id}
                          title={`${a.profiles?.first_name ?? ""} ${a.profiles?.last_name ?? ""}`}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ background: a.profiles?.color ?? "#6366f1" }}
                        >
                          {(a.profiles?.first_name?.[0] ?? "") + (a.profiles?.last_name?.[0] ?? "")}
                        </div>
                      ))}
                      {(visit.visit_assignments?.length ?? 0) > 3 && (
                        <span className="text-white/30 text-[10px]">+{(visit.visit_assignments?.length ?? 0) - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Panel latéral — semaine en cours */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Toutes les visites à venir</h3>
          <span className="text-white/30 text-sm">{visits.filter(v => v.status !== "cancelled" && v.status !== "completed").length} actives</span>
        </div>

        {/* Groupées par jour */}
        {groupByDay(visits.filter(v => !["cancelled", "completed", "archived"].includes(v.status))).map(({ day, dayVisits: dv }) => (
          <div key={day}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isSameDay(new Date(day), new Date())
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "text-white/30"
              }`}>
                {new Date(day).toLocaleDateString("fr-CA", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div className="h-px flex-1 bg-emerald-900/20" />
              <span className="text-white/20 text-xs">{dv.length} visite{dv.length > 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-2">
              {dv.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => router.push(`/jobs/${visit.job_id}`)}
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-emerald-900/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-900/30 cursor-pointer transition-all"
                >
                  {/* Heure */}
                  <div className="text-right flex-shrink-0 w-16">
                    <div className="text-white/70 text-sm font-medium tabular-nums">
                      {new Date(visit.scheduled_start).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-white/25 text-xs flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {Math.round((new Date(visit.scheduled_end).getTime() - new Date(visit.scheduled_start).getTime()) / 60000)}m
                    </div>
                  </div>

                  {/* Barre colorée */}
                  <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                    visit.status === "completed" ? "bg-emerald-500" :
                    visit.status === "in_progress" ? "bg-amber-500" :
                    visit.status === "en_route" ? "bg-violet-500" :
                    "bg-blue-500"
                  }`} />

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-sm font-medium truncate">
                      {visit.jobs?.title ?? "Job sans titre"}
                    </div>
                    <div className="flex items-center gap-2 text-white/35 text-xs mt-0.5">
                      <User className="h-3 w-3" />
                      {clientName(visit)}
                      {visit.jobs?.properties && (
                        <>
                          <span>·</span>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{visit.jobs.properties.address}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Techniciens + badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex -space-x-1">
                      {(visit.visit_assignments ?? []).slice(0, 3).map((a) => (
                        <div
                          key={a.profile_id}
                          title={`${a.profiles?.first_name ?? ""} ${a.profiles?.last_name ?? ""}`}
                          className="w-6 h-6 rounded-full border-2 border-[#020c05] flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: a.profiles?.color ?? "#6366f1" }}
                        >
                          {(a.profiles?.first_name?.[0] ?? "") + (a.profiles?.last_name?.[0] ?? "")}
                        </div>
                      ))}
                    </div>
                    <VisitStatusBadge status={visit.status} />
                    <ArrowRight className="h-3.5 w-3.5 text-white/20 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {visits.filter(v => !["cancelled", "completed"].includes(v.status)).length === 0 && (
          <div className="text-center py-16 text-white/25">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune visite planifiée.</p>
            <button
              onClick={() => router.push("/jobs/new")}
              className="mt-3 text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors"
            >
              Créer un premier job →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDay(visits: VisitWithRelations[]) {
  const map = new Map<string, VisitWithRelations[]>();
  const sorted = [...visits].sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  );
  for (const v of sorted) {
    const day = v.scheduled_start.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(v);
  }
  return Array.from(map.entries()).map(([day, dayVisits]) => ({ day, dayVisits }));
}
