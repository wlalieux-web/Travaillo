"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, User, CheckCircle2, XCircle, Navigation, Plus, ChevronRight } from "lucide-react";
import { VisitStatusBadge } from "@/components/jobs/job-status-badge";
import { completeVisit, markEnRoute, markArrived } from "@/lib/visits/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { VisitWithRelations } from "@/lib/jobs/types";

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-CA", { weekday: "short", month: "short", day: "numeric" });
}
function duration(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
}

export function VisitsTimeline({
  visits,
  jobId,
  onAddVisit,
}: {
  visits: VisitWithRelations[];
  jobId: string;
  onAddVisit?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function action(fn: () => Promise<{ ok: boolean; error?: string }>, visitId: string, successMsg: string) {
    setLoading(visitId);
    const res = await fn();
    setLoading(null);
    if (res.ok) { toast.success(successMsg); router.refresh(); }
    else toast.error(res.error ?? "Erreur");
  }

  const now = new Date();
  const upcoming = visits.filter((v) => new Date(v.scheduled_start) >= now && !["completed", "cancelled"].includes(v.status));
  const past = visits.filter((v) => new Date(v.scheduled_start) < now || ["completed", "cancelled", "no_show"].includes(v.status));

  function VisitCard({ v }: { v: VisitWithRelations }) {
    const assignees = v.visit_assignments ?? [];
    const isPast = ["completed", "cancelled", "no_show"].includes(v.status);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-4 transition-all ${
          isPast
            ? "border-white/[0.06] bg-white/[0.01] opacity-60"
            : "border-emerald-900/25 bg-white/[0.03] hover:bg-white/[0.05]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
              <span className="text-white/70 text-sm font-medium">{fmtDate(v.scheduled_start)}</span>
              <span className="text-white/30 text-xs">
                {fmtTime(v.scheduled_start)} → {fmtTime(v.scheduled_end)}
              </span>
              <span className="text-white/20 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration(v.scheduled_start, v.scheduled_end)}
              </span>
            </div>

            {/* Techniciens */}
            {assignees.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                <User className="h-3 w-3 text-white/20" />
                {assignees.map((a) => (
                  <div
                    key={a.profile_id}
                    className="flex items-center gap-1.5 text-xs text-white/40"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: a.profiles?.color ?? "#6366f1" }}
                    >
                      {(a.profiles?.first_name?.[0] ?? "") + (a.profiles?.last_name?.[0] ?? "")}
                    </div>
                    {a.is_primary && <span className="text-emerald-400/60">(principal)</span>}
                  </div>
                ))}
              </div>
            )}

            {v.technician_notes && (
              <p className="text-white/30 text-xs mt-1 truncate">{v.technician_notes}</p>
            )}
          </div>

          <VisitStatusBadge status={v.status} />
        </div>

        {/* Actions pour les visites actives */}
        {!isPast && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
            {v.status === "scheduled" && (
              <button
                onClick={() => action(() => markEnRoute(v.id), v.id, "Statut mis à jour : En route")}
                disabled={loading === v.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors disabled:opacity-50"
              >
                <Navigation className="h-3 w-3" /> En route
              </button>
            )}
            {v.status === "en_route" && (
              <button
                onClick={() => action(() => markArrived(v.id), v.id, "Arrivée enregistrée")}
                disabled={loading === v.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                <CalendarDays className="h-3 w-3" /> Arrivé
              </button>
            )}
            {["scheduled", "en_route", "in_progress"].includes(v.status) && (
              <button
                onClick={() => action(() => completeVisit(v.id), v.id, "Visite complétée !")}
                disabled={loading === v.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" /> Compléter
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* À venir */}
      {upcoming.length > 0 && (
        <div>
          <h4 className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">À venir ({upcoming.length})</h4>
          <div className="space-y-3">
            {upcoming.map((v) => <VisitCard key={v.id} v={v} />)}
          </div>
        </div>
      )}

      {/* Bouton ajouter */}
      {onAddVisit && (
        <button
          onClick={onAddVisit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-emerald-900/30 text-white/30 hover:text-emerald-400 hover:border-emerald-700/40 transition-all text-sm"
        >
          <Plus className="h-4 w-4" /> Ajouter une visite
        </button>
      )}

      {/* Passées */}
      {past.length > 0 && (
        <div>
          <h4 className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-3">Historique ({past.length})</h4>
          <div className="space-y-3">
            {past.map((v) => <VisitCard key={v.id} v={v} />)}
          </div>
        </div>
      )}

      {visits.length === 0 && (
        <div className="text-center py-8 text-white/25 text-sm">
          Aucune visite planifiée.
        </div>
      )}
    </div>
  );
}
