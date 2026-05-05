"use client";

import { useState, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn, LogOut, Coffee, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2,
} from "lucide-react";
import { addDays, addWeeks, endOfWeek, isToday, parseISO, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { clockIn, clockOut, startBreak, endBreak, listMyTimeEntries } from "@/lib/time/actions";

// ─── Utilities ────────────────────────────────────────────────

function useLiveDuration(clockInAt: string | null): string {
  const [, tick] = useReducer(n => n + 1, 0);
  useEffect(() => {
    if (!clockInAt) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInAt]);
  if (!clockInAt) return "--:--:--";
  const s = Math.max(0, Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function getNetMinutes(e: any): number {
  if (e.duration_minutes != null) return e.duration_minutes;
  if (!e.clock_out_at) return 0;
  return Math.max(0,
    Math.round((new Date(e.clock_out_at).getTime() - new Date(e.clock_in_at).getTime()) / 60000)
    - (e.break_minutes ?? 0)
  );
}

function fmt(minutes: number): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
}

const DAYS      = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// ─── Types ────────────────────────────────────────────────────

interface Props {
  profile: { id: string; first_name: string | null; last_name: string | null; color: string; role: string };
  openEntry: { id: string; clock_in_at: string; visit_id: string | null } | null;
  entries: any[];
  weekStartISO: string;
}

// ─── Component ───────────────────────────────────────────────

export function EmployeeView({ profile, openEntry: initOpen, entries: initEntries, weekStartISO }: Props) {
  const router = useRouter();
  const [open, setOpen]         = useState(initOpen);
  const [onBreak, setOnBreak]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [weekStart, setWeekStart] = useState(() => parseISO(weekStartISO));
  const [entries, setEntries]   = useState(initEntries);
  const [weekLoading, setWeekLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const duration = useLiveDuration(open?.clock_in_at ?? null);

  // Expand today on mount
  useEffect(() => {
    const idx = differenceInCalendarDays(new Date(), parseISO(weekStartISO));
    if (idx >= 0 && idx < 7) setExpanded(idx);
  }, [weekStartISO]);

  // ── Actions ──────────────────────────────────────────────

  async function handleClockIn() {
    setLoading(true);
    const res = await clockIn({});
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Pointage d'arrivée enregistré !");
    setOpen({ id: res.data.entryId, clock_in_at: new Date().toISOString(), visit_id: null });
  }

  async function handleClockOut() {
    setLoading(true);
    const res = await clockOut();
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Sortie pointée — ${fmt(res.data.minutes)}`);
    setOpen(null);
    setOnBreak(false);
    const refresh = await listMyTimeEntries(weekStart.toISOString());
    if (refresh.ok) setEntries(refresh.data.entries as any[]);
    router.refresh();
  }

  async function handleBreak() {
    setLoading(true);
    if (onBreak) {
      const res = await endBreak();
      if (res.ok) { toast.success(`Pause terminée — ${fmt(res.data.minutes)}`); setOnBreak(false); }
      else toast.error(res.error);
    } else {
      const res = await startBreak("unpaid");
      if (res.ok) { toast.success("Pause commencée"); setOnBreak(true); }
      else toast.error(res.error);
    }
    setLoading(false);
  }

  async function navigateWeek(dir: -1 | 1) {
    setWeekLoading(true);
    const next = addWeeks(weekStart, dir);
    setWeekStart(next);
    const res = await listMyTimeEntries(next.toISOString());
    if (res.ok) setEntries(res.data.entries as any[]);
    setWeekLoading(false);
  }

  // ── Day data ─────────────────────────────────────────────

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayEntries = entries.filter(e =>
      new Date(e.clock_in_at).toDateString() === date.toDateString()
    );
    return { date, entries: dayEntries, minutes: dayEntries.reduce((s, e) => s + getNetMinutes(e), 0) };
  });

  const weekTotal  = days.reduce((s, d) => s + d.minutes, 0);
  const maxMinutes = Math.max(...days.map(d => d.minutes), 480);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Clock Panel ─────────────────────────────────── */}
      <div className={`rounded-2xl border p-8 text-center transition-colors duration-500 ${
        open ? "bg-emerald-500/[0.04] border-emerald-500/25" : "bg-white/[0.02] border-emerald-900/20"
      }`}>
        {/* Status dot */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {open ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase">En service</span>
            </>
          ) : (
            <>
              <span className="h-3 w-3 rounded-full bg-white/15" />
              <span className="text-white/30 text-xs font-bold tracking-[0.2em] uppercase">Pas pointé</span>
            </>
          )}
          {onBreak && (
            <span className="ml-1 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              Pause
            </span>
          )}
        </div>

        {/* Timer */}
        <p className={`text-6xl font-bold tabular-nums tracking-widest mb-2 transition-colors ${
          open ? "text-white" : "text-white/10"
        }`}>
          {open ? duration : "--:--:--"}
        </p>
        <p className="text-white/30 text-sm h-5">
          {open ? `Pointé à ${fmtTime(open.clock_in_at)}` : ""}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-7">
          {open ? (
            <>
              <button onClick={handleBreak} disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
                  onBreak
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                    : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.08]"
                }`}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coffee className="h-4 w-4" />}
                {onBreak ? "Fin de pause" : "Pause"}
              </button>
              <button onClick={handleClockOut} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm font-semibold hover:bg-rose-500/20 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Pointer la sortie
              </button>
            </>
          ) : (
            <button onClick={handleClockIn} disabled={loading}
              className="flex items-center gap-2 px-10 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_45px_rgba(16,185,129,0.45)] transition-all disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              Pointer l'arrivée
            </button>
          )}
        </div>
      </div>

      {/* ── Week Card ───────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold">Ma semaine</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {weekStart.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}
              {" – "}
              {endOfWeek(weekStart, { weekStartsOn: 1 }).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {weekLoading && <Loader2 className="h-4 w-4 text-white/30 animate-spin" />}
            <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-lg overflow-hidden">
              <button onClick={() => navigateWeek(-1)} disabled={weekLoading}
                className="px-2 py-1.5 text-white/40 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigateWeek(1)} disabled={weekLoading}
                className="px-2 py-1.5 text-white/40 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-30 border-l border-white/[0.07]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm">
              <span className="text-white/30">Total </span>
              <span className="text-emerald-400 font-bold">{fmt(weekTotal)}</span>
            </div>
          </div>
        </div>

        {/* Day bars */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {days.map((day, i) => {
            const today   = isToday(day.date);
            const barH    = day.minutes > 0 ? Math.max(6, (day.minutes / maxMinutes) * 44) : 0;
            const active  = expanded === i;
            return (
              <button key={i} onClick={() => setExpanded(active ? null : i)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  today   ? "bg-emerald-500/[0.07] border border-emerald-500/15"
                          : active ? "bg-white/[0.04] border border-white/10" : "hover:bg-white/[0.02] border border-transparent"
                }`}>
                <span className={`text-xs font-medium ${today ? "text-emerald-400" : "text-white/30"}`}>{DAYS[i]}</span>
                <div className="h-11 w-full flex items-end justify-center">
                  <motion.div animate={{ height: barH > 0 ? barH : 3 }} initial={{ height: 0 }}
                    className={`w-5 rounded-sm ${
                      day.minutes > 0 ? today ? "bg-emerald-400" : "bg-emerald-700" : "bg-white/[0.07]"
                    }`} />
                </div>
                <span className={`text-[11px] tabular-nums font-medium ${
                  day.minutes > 0 ? today ? "text-emerald-400" : "text-white/60" : "text-white/15"
                }`}>
                  {day.minutes > 0 ? fmt(day.minutes) : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Entry list */}
        <div className="space-y-1.5">
          {days.map((day, i) => {
            const today      = isToday(day.date);
            const hasEntries = day.entries.length > 0;
            const isFuture   = day.date > new Date() && !today;
            if (isFuture && !hasEntries) return null;

            const isExpanded = expanded === i;

            return (
              <div key={i} className="rounded-xl border border-white/[0.05] overflow-hidden">
                <button onClick={() => setExpanded(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="flex items-center gap-2">
                    {today && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                    <span className={`text-sm font-medium ${today ? "text-white" : "text-white/50"}`}>
                      {DAYS_FULL[i]} {day.date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasEntries ? (
                      <span className="text-sm font-semibold text-emerald-400">{fmt(day.minutes)}</span>
                    ) : today && open ? (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">En service</span>
                    ) : (
                      <span className="text-xs text-white/20">Aucun pointage</span>
                    )}
                    <ChevronRight className={`h-3.5 w-3.5 text-white/20 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div key="content"
                      initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden">
                      <div className="border-t border-white/[0.04] divide-y divide-white/[0.03]">
                        {hasEntries ? day.entries.map((entry: any) => (
                          <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-white/80 tabular-nums">{fmtTime(entry.clock_in_at)}</span>
                                <span className="text-white/20 text-xs">→</span>
                                <span className={`tabular-nums ${!entry.clock_out_at ? "text-emerald-400" : "text-white/80"}`}>
                                  {entry.clock_out_at ? fmtTime(entry.clock_out_at) : duration}
                                </span>
                              </div>
                              {(entry.break_minutes ?? 0) > 0 && (
                                <p className="text-white/25 text-xs mt-0.5">Pause : {fmt(entry.break_minutes)}</p>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-white/70 tabular-nums">
                              {entry.clock_out_at ? fmt(getNetMinutes(entry)) : duration}
                            </span>
                            {entry.approved_at ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-1 flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3" /> Approuvé
                              </span>
                            ) : entry.clock_out_at ? (
                              <span className="text-xs text-white/25 bg-white/[0.04] rounded-full px-2.5 py-1 flex-shrink-0">
                                En attente
                              </span>
                            ) : null}
                          </div>
                        )) : today && open ? (
                          <div className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-white/80 tabular-nums">{fmtTime(open.clock_in_at)}</span>
                                <span className="text-white/20 text-xs">→</span>
                                <span className="text-emerald-400 tabular-nums">{duration}</span>
                              </div>
                            </div>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                          </div>
                        ) : (
                          <p className="px-4 py-3 text-white/20 text-sm">Aucune entrée pour cette journée.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
