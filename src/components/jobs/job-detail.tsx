"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, User, MapPin, RefreshCw, CalendarDays,
  Clock, DollarSign, FileText, Trash2, XCircle,
  CheckCircle2, Receipt, BriefcaseBusiness, StickyNote,
} from "lucide-react";
import { JobStatusBadge, VisitStatusBadge } from "@/components/jobs/job-status-badge";
import { VisitsTimeline } from "@/components/jobs/visits-timeline";
import { cancelJob, deleteJob } from "@/lib/jobs/actions";
import { toast } from "sonner";
import type { Job, VisitWithRelations } from "@/lib/jobs/types";
import type { TimeEntryWithRelations } from "@/lib/time/types";

interface Technician { id: string; first_name: string | null; last_name: string | null; color: string; avatar_url: string | null }

interface Props {
  job: Job & {
    clients?: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
    properties?: { address: string; city: string | null; name: string | null } | null;
  };
  visits: VisitWithRelations[];
  timeEntries: TimeEntryWithRelations[];
  technicians: Technician[];
}

const TABS = ["Aperçu", "Visites", "Pointages", "Notes"] as const;
type Tab = typeof TABS[number];

function clientName(job: Props["job"]) {
  const c = job.clients;
  if (!c) return "—";
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
}

export function JobDetail({ job, visits, timeEntries, technicians }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Aperçu");

  async function handleCancel() {
    if (!confirm("Annuler ce job et toutes ses visites futures ?")) return;
    const res = await cancelJob(job.id);
    if (res.ok) { toast.success("Job annulé"); router.refresh(); }
    else toast.error(res.error);
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce job définitivement ? Cette action est irréversible.")) return;
    const res = await deleteJob(job.id);
    if (res.ok) { router.push("/jobs"); toast.success("Job supprimé"); }
    else toast.error(res.error);
  }

  const totalMins = timeEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
  const totalBillableMins = timeEntries.filter((e) => e.billable).reduce((s, e) => s + (e.duration_minutes ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => router.back()} className="text-white/30 hover:text-white/60 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-emerald-400 font-mono text-base font-semibold">{job.number}</span>
              <JobStatusBadge status={job.status} />
              {job.type === "recurring" && (
                <span className="inline-flex items-center gap-1 text-cyan-400 text-xs">
                  <RefreshCw className="h-3 w-3" /> Récurrent
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{job.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-white/40">
              <Link href={`/clients/${job.client_id}`} className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                <User className="h-3.5 w-3.5" /> {clientName(job)}
              </Link>
              {job.properties && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.properties.name ? `${job.properties.name} — ` : ""}{job.properties.address}
                  {job.properties.city ? `, ${job.properties.city}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!["cancelled", "completed", "archived"].includes(job.status) && (
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/20 text-amber-400/70 text-xs hover:text-amber-400 hover:bg-amber-500/[0.07] transition-all">
                <XCircle className="h-3.5 w-3.5" /> Annuler
              </button>
            )}
            {/* Convertir en facture (disabled) */}
            <div title="Disponible dans le Module Factures">
              <button disabled className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/20 text-xs cursor-not-allowed">
                <Receipt className="h-3.5 w-3.5" /> Facturer
                <span className="text-[10px] bg-white/[0.06] px-1 py-0.5 rounded ml-1">Bientôt</span>
              </button>
            </div>
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-400/50 text-xs hover:text-rose-400 hover:bg-rose-500/[0.07] transition-all">
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/[0.04] text-sm">
          {job.estimated_duration_minutes && (
            <span className="flex items-center gap-1.5 text-white/40">
              <Clock className="h-3.5 w-3.5" /> Estimé : {fmtMins(job.estimated_duration_minutes)}
            </span>
          )}
          {totalMins > 0 && (
            <span className="flex items-center gap-1.5 text-white/40">
              <Clock className="h-3.5 w-3.5" /> Réalisé : {fmtMins(totalMins)}
            </span>
          )}
          {job.total > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-400/70">
              <DollarSign className="h-3.5 w-3.5" />
              {job.total.toLocaleString("fr-CA", { style: "currency", currency: job.currency })}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-white/30">
            <CalendarDays className="h-3.5 w-3.5" /> {visits.length} visite{visits.length !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.02] border border-emerald-900/20 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab === "Visites" && <CalendarDays className="h-3.5 w-3.5" />}
            {tab === "Pointages" && <Clock className="h-3.5 w-3.5" />}
            {tab === "Notes" && <StickyNote className="h-3.5 w-3.5" />}
            {tab === "Aperçu" && <BriefcaseBusiness className="h-3.5 w-3.5" />}
            {tab}
            {tab === "Visites" && <span className="ml-1 text-xs text-white/30">{visits.length}</span>}
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      {activeTab === "Aperçu" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5 space-y-3 text-sm">
            <h3 className="text-white/50 font-semibold text-xs uppercase tracking-wider mb-4">Détails</h3>
            {[
              { label: "Type", value: job.type === "one_off" ? "Ponctuel" : "Récurrent" },
              { label: "Créé le", value: new Date(job.created_at).toLocaleDateString("fr-CA") },
              ...(job.recurrence_rule ? [{ label: "Récurrence", value: job.recurrence_rule }] : []),
              ...(job.quote_id ? [{ label: "Devis source", value: job.quote_id.slice(0, 8) + "..." }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-white/35">{label}</span>
                <span className="text-white/70 font-mono text-xs text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Prochaines visites */}
          <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5">
            <h3 className="text-white/50 font-semibold text-xs uppercase tracking-wider mb-4">Prochaines visites</h3>
            {visits.filter((v) => !["completed", "cancelled"].includes(v.status)).slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <VisitStatusBadge status={v.status} />
                <span className="text-white/50 text-xs">
                  {new Date(v.scheduled_start).toLocaleDateString("fr-CA", { weekday: "short", month: "short", day: "numeric" })}
                  {" "}{new Date(v.scheduled_start).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {visits.filter((v) => !["completed", "cancelled"].includes(v.status)).length === 0 && (
              <p className="text-white/25 text-xs">Aucune visite à venir</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "Visites" && (
        <VisitsTimeline visits={visits} jobId={job.id} />
      )}

      {activeTab === "Pointages" && (
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl overflow-hidden">
          {timeEntries.length === 0 ? (
            <div className="p-10 text-center text-white/25 text-sm">Aucun pointage enregistré pour ce job.</div>
          ) : (
            <>
              <div className="px-5 py-3 bg-white/[0.02] border-b border-emerald-900/20 flex gap-6 text-sm">
                <span className="text-white/50">Total : <span className="text-white/80 font-semibold">{fmtMins(totalMins)}</span></span>
                <span className="text-white/50">Facturable : <span className="text-emerald-400 font-semibold">{fmtMins(totalBillableMins)}</span></span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/10">
                    {["Technicien", "Entrée", "Sortie", "Durée", "Statut"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-white/30 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((e) => (
                    <tr key={e.id} className="border-b border-emerald-900/10 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: (e.profiles as any)?.color ?? "#6366f1" }}>
                            {((e.profiles as any)?.first_name?.[0] ?? "") + ((e.profiles as any)?.last_name?.[0] ?? "")}
                          </div>
                          <span className="text-white/60 text-xs">{[(e.profiles as any)?.first_name, (e.profiles as any)?.last_name].filter(Boolean).join(" ")}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/50 text-xs">{new Date(e.clock_in_at).toLocaleString("fr-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-5 py-3 text-white/50 text-xs">{e.clock_out_at ? new Date(e.clock_out_at).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }) : <span className="text-amber-400">En cours</span>}</td>
                      <td className="px-5 py-3 text-white/70 text-xs font-medium">{e.duration_minutes ? fmtMins(e.duration_minutes) : "—"}</td>
                      <td className="px-5 py-3">
                        {e.approved_at
                          ? <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Approuvé</span>
                          : <span className="text-white/30 text-xs">En attente</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {activeTab === "Notes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "Instructions pour le client", value: job.client_instructions, icon: FileText },
            { label: "Notes internes", value: job.internal_notes, icon: StickyNote },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5">
              <h3 className="text-white/50 font-semibold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" /> {label}
              </h3>
              {value ? (
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
              ) : (
                <p className="text-white/20 text-sm">Aucune note</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
