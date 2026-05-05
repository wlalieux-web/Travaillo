"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LogIn, LogOut, Loader2, Coffee } from "lucide-react";
import { clockIn, clockOut, startBreak, endBreak } from "@/lib/time/actions";
import { toast } from "sonner";

interface OpenEntry { id: string; clock_in_at: string; visit_id: string | null }

interface Props {
  initialOpen: OpenEntry | null;
  todayVisits: Array<{ id: string; scheduled_start: string; jobs: { title: string } | null }>;
}

function useDuration(clockInAt: string | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!clockInAt) { setSeconds(0); return; }
    const update = () => setSeconds(Math.floor((Date.now() - new Date(clockInAt).getTime()) / 1000));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [clockInAt]);

  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}m`;
}

export function ClockWidget({ initialOpen, todayVisits }: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<string>(initialOpen?.visit_id ?? "");
  const [onBreak, setOnBreak] = useState(false);

  const duration = useDuration(open?.clock_in_at ?? null);

  async function handleClockIn() {
    setLoading(true);
    const res = await clockIn({ visit_id: selectedVisit || null });
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Pointage d'arrivée enregistré !");
    setOpen({ id: res.data.entryId, clock_in_at: new Date().toISOString(), visit_id: selectedVisit || null });
    setShowPanel(false);
  }

  async function handleClockOut() {
    setLoading(true);
    const res = await clockOut();
    setLoading(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Sortie pointée — ${res.data.minutes}m travaillées`);
    setOpen(null);
    setOnBreak(false);
    setShowPanel(false);
  }

  async function handleBreak() {
    setLoading(true);
    if (onBreak) {
      const res = await endBreak();
      if (res.ok) { toast.success(`Pause terminée (${res.data.minutes}m)`); setOnBreak(false); }
      else toast.error(res.error);
    } else {
      const res = await startBreak("unpaid");
      if (res.ok) { toast.success("Pause commencée"); setOnBreak(true); }
      else toast.error(res.error);
    }
    setLoading(false);
  }

  return (
    <div className="relative">
      {/* Bouton compact */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          open
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
        }`}
      >
        <Clock className={`h-3.5 w-3.5 ${open ? "text-emerald-400" : ""}`} />
        {open ? (
          <span className="tabular-nums">{duration}</span>
        ) : (
          <span>Pointer</span>
        )}
        {onBreak && <Coffee className="h-3 w-3 text-amber-400" />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-72 bg-[#0d1f10] border border-emerald-900/30 rounded-2xl shadow-2xl p-5 space-y-4"
          >
            {!open ? (
              <>
                <h4 className="text-white font-semibold text-sm">Pointer l'arrivée</h4>
                {todayVisits.length > 0 && (
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Visite du jour</label>
                    <select
                      value={selectedVisit}
                      onChange={(e) => setSelectedVisit(e.target.value)}
                      className="w-full bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2 text-white text-xs focus:outline-none appearance-none"
                    >
                      <option value="" className="bg-[#0d1f10]">— Aucune visite spécifique —</option>
                      {todayVisits.map((v) => (
                        <option key={v.id} value={v.id} className="bg-[#0d1f10]">
                          {new Date(v.scheduled_start).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })} — {v.jobs?.title ?? "Job"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Pointer l'arrivée
                </button>
              </>
            ) : (
              <>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Pointé depuis</h4>
                  <p className="text-emerald-400 text-2xl font-bold tabular-nums">{duration}</p>
                  <p className="text-white/30 text-xs mt-1">
                    {new Date(open.clock_in_at).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    {onBreak && <span className="text-amber-400 ml-2">· Pause en cours</span>}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBreak}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      onBreak
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                        : "border-white/[0.08] text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    {onBreak ? "Fin de pause" : "Pause"}
                  </button>
                  <button
                    onClick={handleClockOut}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                    Pointer la sortie
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
