"use client";

import { useState, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn, LogOut, Coffee, ChevronLeft, ChevronRight,
  CheckCircle2, Loader2, Clock, RefreshCw, Users,
} from "lucide-react";
import { addDays, addWeeks, endOfWeek, isToday, parseISO, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import {
  clockIn, clockOut, startBreak, endBreak,
  listMyTimeEntries, listTeamWeekEntries,
  getTeamOpenEntries, approveTimeEntry, bulkApproveWeek,
} from "@/lib/time/actions";

// ─── Utilities ────────────────────────────────────────────────

function useLiveDuration(clockInAt: string | null): string {
  const [, tick] = useReducer(n => n + 1, 0);
  useEffect(() => {
    if (!clockInAt) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInAt]);
  if (!clockInAt) return "--:--";
  const s = Math.max(0, Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
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

function initials(m: any): string {
  return [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── Employee live card ───────────────────────────────────────

function EmployeeCard({ member, openEntry }: { member: any; openEntry: any }) {
  const duration = useLiveDuration(openEntry?.clock_in_at ?? null);
  const clocked  = !!openEntry;
  return (
    <div className={`flex-shrink-0 w-40 rounded-xl border p-4 transition-colors ${
      clocked ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
    }`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2.5 select-none"
        style={{ backgroundColor: member.color ?? "#6366f1" }}>
        {initials(member)}
      </div>
      <p className="text-white text-sm font-medium leading-tight truncate">
        {member.first_name} {member.last_name}
      </p>
      {clocked ? (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-xs tabular-nums font-medium">{duration}</span>
        </div>
      ) : (
        <p className="text-white/25 text-xs mt-1.5">Pas pointé</p>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────

interface Props {
  profile: { id: string; first_name: string | null; last_name: string | null; color: string; role: string };
  openEntry: { id: string; clock_in_at: string; visit_id: string | null } | null;
  myEntries: any[];
  teamMembers: any[];
  teamWeekEntries: any[];
  teamOpenEntries: any[];
  pendingEntries: any[];
  weekStartISO: string;
}

// ─── Component ───────────────────────────────────────────────

export function AdminView({
  profile, openEntry: initOpen, myEntries: initMyEntries,
  teamMembers, teamWeekEntries: initTeamEntries,
  teamOpenEntries: initTeamOpen, pendingEntries: initPending,
  weekStartISO,
}: Props) {
  const router = useRouter();

  const [myOpen, setMyOpen]       = useState(initOpen);
  const [myEntries, setMyEntries] = useState(initMyEntries);
  const [teamOpen, setTeamOpen]   = useState(initTeamOpen);
  const [teamEntries, setTeamEntries] = useState(initTeamEntries);
  const [pending, setPending]     = useState(initPending);
  const [weekStart, setWeekStart] = useState(() => parseISO(weekStartISO));
  const [weekLoading, setWeekLoading]     = useState(false);
  const [onBreak, setOnBreak]     = useState(false);
  const [myClockLoading, setMyClockLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const myDuration = useLiveDuration(myOpen?.clock_in_at ?? null);

  // Auto-refresh live status every 60 s
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await getTeamOpenEntries();
      if (res.ok) setTeamOpen(res.data as any[]);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── My clock ─────────────────────────────────────────────

  async function handleMyClockIn() {
    setMyClockLoading(true);
    const res = await clockIn({});
    setMyClockLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Pointage d'arrivée enregistré !");
    setMyOpen({ id: res.data.entryId, clock_in_at: new Date().toISOString(), visit_id: null });
  }

  async function handleMyClockOut() {
    setMyClockLoading(true);
    const res = await clockOut();
    setMyClockLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Sortie pointée — ${fmt(res.data.minutes)}`);
    setMyOpen(null);
    setOnBreak(false);
    const r = await listMyTimeEntries(weekStart.toISOString());
    if (r.ok) setMyEntries(r.data.entries as any[]);
    router.refresh();
  }

  async function handleBreak() {
    setMyClockLoading(true);
    if (onBreak) {
      const res = await endBreak();
      if (res.ok) { toast.success(`Pause terminée — ${fmt(res.data.minutes)}`); setOnBreak(false); }
      else toast.error(res.error);
    } else {
      const res = await startBreak("unpaid");
      if (res.ok) { toast.success("Pause commencée"); setOnBreak(true); }
      else toast.error(res.error);
    }
    setMyClockLoading(false);
  }

  // ── Week navigation ──────────────────────────────────────

  async function navigateWeek(dir: -1 | 1) {
    setWeekLoading(true);
    const next = addWeeks(weekStart, dir);
    setWeekStart(next);
    const [myRes, teamRes] = await Promise.all([
      listMyTimeEntries(next.toISOString()),
      listTeamWeekEntries(next.toISOString()),
    ]);
    if (myRes.ok)   setMyEntries(myRes.data.entries as any[]);
    if (teamRes.ok) setTeamEntries(teamRes.data as any[]);
    setWeekLoading(false);
  }

  // ── Approvals ────────────────────────────────────────────

  async function handleApprove(id: string) {
    setApproving(id);
    const res = await approveTimeEntry(id);
    setApproving(null);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Entrée approuvée");
    setPending(prev => prev.filter(e => e.id !== id));
    setTeamEntries(prev => prev.map(e => e.id === id ? { ...e, approved_at: new Date().toISOString() } : e));
  }

  async function handleBulkApprove(profileId: string) {
    setBulkApproving(profileId);
    const res = await bulkApproveWeek(profileId, weekStart.toISOString());
    setBulkApproving(null);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`${res.data.count} entrée(s) approuvée(s)`);
    const now = new Date().toISOString();
    setTeamEntries(prev => prev.map(e =>
      e.profile_id === profileId && !e.approved_at && e.clock_out_at ? { ...e, approved_at: now } : e
    ));
    setPending(prev => prev.filter(e => e.profile_id !== profileId));
  }

  async function refreshLive() {
    setRefreshing(true);
    const res = await getTeamOpenEntries();
    if (res.ok) setTeamOpen(res.data as any[]);
    setRefreshing(false);
  }

  // ── Day helpers ──────────────────────────────────────────

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const openById = new Map(teamOpen.map((e: any) => [e.profile_id, e]));

  function getMemberDayMinutes(memberId: string, dayIdx: number) {
    return teamEntries
      .filter((e: any) => e.profile_id === memberId && e.clock_out_at && differenceInCalendarDays(new Date(e.clock_in_at), weekStart) === dayIdx)
      .reduce((s: number, e: any) => s + getNetMinutes(e), 0);
  }

  function getMemberTotal(memberId: string) {
    return teamEntries
      .filter((e: any) => e.profile_id === memberId && e.clock_out_at)
      .reduce((s: number, e: any) => s + getNetMinutes(e), 0);
  }

  function memberHasUnapproved(memberId: string) {
    return teamEntries.some((e: any) => e.profile_id === memberId && e.clock_out_at && !e.approved_at);
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Live Team Status ────────────────────────────── */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Équipe en direct
            <span className="text-white/25 font-normal text-xs">
              ({teamOpen.length} pointé{teamOpen.length > 1 ? "s" : ""})
            </span>
          </h2>
          <button onClick={refreshLive} disabled={refreshing}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-40">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {teamMembers.length === 0 ? (
          <p className="text-white/25 text-sm">Aucun membre dans l'équipe.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {teamMembers.map(member => (
              <EmployeeCard key={member.id} member={member} openEntry={openById.get(member.id) ?? null} />
            ))}
          </div>
        )}
      </div>

      {/* ── My Clock ────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 flex items-center gap-5 transition-colors ${
        myOpen ? "bg-emerald-500/[0.04] border-emerald-500/20" : "bg-white/[0.02] border-emerald-900/20"
      }`}>
        <div className="flex items-center gap-2 flex-shrink-0">
          {myOpen ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          )}
          <span className={`text-sm font-medium ${myOpen ? "text-emerald-400" : "text-white/40"}`}>
            Mon pointage
          </span>
        </div>

        {myOpen ? (
          <>
            <span className="text-white text-xl font-bold tabular-nums tracking-wide">{myDuration}</span>
            <span className="text-white/30 text-sm">depuis {fmtTime(myOpen.clock_in_at)}</span>
            {onBreak && <span className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">Pause</span>}
            <div className="ml-auto flex gap-2">
              <button onClick={handleBreak} disabled={myClockLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 ${
                  onBreak
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white"
                }`}>
                {myClockLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Coffee className="h-3 w-3" />}
                {onBreak ? "Fin de pause" : "Pause"}
              </button>
              <button onClick={handleMyClockOut} disabled={myClockLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all disabled:opacity-50">
                {myClockLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                Pointer la sortie
              </button>
            </div>
          </>
        ) : (
          <button onClick={handleMyClockIn} disabled={myClockLoading}
            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50">
            {myClockLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Pointer l'arrivée
          </button>
        )}
      </div>

      {/* ── Team Weekly Grid ─────────────────────────────── */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold">Résumé de la semaine</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {weekStart.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}
              {" – "}
              {endOfWeek(weekStart, { weekStartsOn: 1 }).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-white/25 text-sm">Aucun membre dans l'équipe.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left pb-3 pr-4 text-white/30 text-xs font-medium w-44">Employé</th>
                  {weekDays.map((day, i) => (
                    <th key={i} className={`text-center pb-3 px-2 text-xs font-medium ${isToday(day) ? "text-emerald-400" : "text-white/30"}`}>
                      {DAYS[i]}<br />
                      <span className="text-[10px] font-normal opacity-70">{day.getDate()}</span>
                    </th>
                  ))}
                  <th className="text-right pb-3 pl-4 text-white/30 text-xs font-medium">Total</th>
                  <th className="pb-3 pl-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {teamMembers.map(member => {
                  const dayMins = weekDays.map((_, i) => getMemberDayMinutes(member.id, i));
                  const total   = dayMins.reduce((a, b) => a + b, 0);
                  const hasUnap = memberHasUnapproved(member.id);

                  return (
                    <tr key={member.id} className="group">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: member.color ?? "#6366f1" }}>
                            {initials(member)}
                          </div>
                          <span className="text-white/70 text-sm truncate">{member.first_name} {member.last_name}</span>
                          {openById.has(member.id) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      {dayMins.map((min, i) => (
                        <td key={i} className={`text-center text-sm tabular-nums py-3 px-2 ${min > 0 ? "text-white/80" : "text-white/15"}`}>
                          {min > 0 ? fmt(min) : "—"}
                        </td>
                      ))}
                      <td className="py-3 pl-4 text-right">
                        <span className={`text-sm font-bold ${total > 0 ? "text-emerald-400" : "text-white/20"}`}>
                          {fmt(total)}
                        </span>
                      </td>
                      <td className="py-3 pl-3">
                        {hasUnap && (
                          <button onClick={() => handleBulkApprove(member.id)} disabled={bulkApproving === member.id}
                            className="flex items-center gap-1 text-xs text-white/30 hover:text-emerald-400 transition-colors disabled:opacity-40 whitespace-nowrap">
                            {bulkApproving === member.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <CheckCircle2 className="h-3 w-3" />}
                            Tout approuver
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pending Approvals ────────────────────────────── */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div key="pending"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-amber-400" />
              En attente d'approbation
              <span className="ml-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 font-normal">
                {pending.length}
              </span>
            </h2>
            <div className="space-y-2">
              {pending.map((entry: any) => {
                const p = entry.profiles;
                return (
                  <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: p?.color ?? "#6366f1" }}>
                      {initials(p ?? {})}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium">{p?.first_name} {p?.last_name}</p>
                      <p className="text-white/30 text-xs">
                        {new Date(entry.clock_in_at).toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" })}
                        {" · "}
                        {fmtTime(entry.clock_in_at)} → {fmtTime(entry.clock_out_at)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-white/60 tabular-nums flex-shrink-0">
                      {fmt(getNetMinutes(entry))}
                    </span>
                    <button onClick={() => handleApprove(entry.id)} disabled={approving === entry.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40 flex-shrink-0">
                      {approving === entry.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Approuver
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
