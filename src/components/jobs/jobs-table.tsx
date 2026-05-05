"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plus, BriefcaseBusiness, MoreVertical, Copy, Trash2, RefreshCw, CalendarDays } from "lucide-react";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { cancelJob, deleteJob } from "@/lib/jobs/actions";
import { toast } from "sonner";
import type { JobWithRelations } from "@/lib/jobs/types";

const STATUS_FILTERS = [
  { value: "", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "scheduled", label: "Planifiés" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Complétés" },
  { value: "cancelled", label: "Annulés" },
];

function clientName(j: JobWithRelations) {
  const c = j.clients;
  if (!c) return "—";
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function JobsTable({ jobs, total }: { jobs: JobWithRelations[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function applyFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  }

  async function handleCancel(id: string) {
    if (!confirm("Annuler ce job et toutes ses visites futures ?")) return;
    const res = await cancelJob(id);
    if (res.ok) { toast.success("Job annulé"); router.refresh(); }
    else toast.error(res.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement ce job ?")) return;
    const res = await deleteJob(id);
    if (res.ok) { toast.success("Job supprimé"); router.refresh(); }
    else toast.error(res.error);
  }

  const activeStatus = searchParams.get("status") ?? "";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={(e) => { e.preventDefault(); applyFilter("q", search); }} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro, titre ou client..."
            className="w-full bg-white/[0.04] border border-emerald-900/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => applyFilter("status", f.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                activeStatus === f.value
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-white/30 text-sm">{total} job{total !== 1 ? "s" : ""}</p>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-emerald-900/20 bg-white/[0.02] p-16 text-center">
          <BriefcaseBusiness className="h-12 w-12 text-white/15 mx-auto mb-4" />
          <p className="text-white/40 text-sm mb-5">
            {search ? `Aucun résultat pour "${search}"` : "Aucun job pour l'instant."}
          </p>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors"
          >
            <Plus className="h-4 w-4" /> Créer un job
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-900/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-emerald-900/20 bg-white/[0.02]">
                {["Numéro", "Titre / Client", "Type", "Statut", "Prochaine visite", "Total", ""].map((h, i) => (
                  <th key={i} className={`text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider ${i >= 2 && i <= 4 ? "hidden md:table-cell" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-emerald-900/10 last:border-0 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <td className="px-5 py-4">
                    <span className="text-emerald-400 font-mono text-sm font-semibold">{job.number}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-white text-sm font-medium truncate max-w-[200px]">{job.title}</div>
                    <div className="text-white/35 text-xs mt-0.5">{clientName(job)}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      {job.type === "recurring" ? (
                        <><RefreshCw className="h-3 w-3 text-cyan-400" /> Récurrent</>
                      ) : (
                        <><CalendarDays className="h-3 w-3 text-white/25" /> Ponctuel</>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/40 text-sm">
                      {job.next_visit ? fmtDate(job.next_visit.scheduled_start) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white font-medium text-sm tabular-nums">
                      {job.total > 0
                        ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: job.currency }).format(job.total)
                        : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex justify-end">
                      <button
                        onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === job.id && (
                        <div className="absolute right-0 top-9 z-20 w-44 bg-[#0d1f10] border border-emerald-900/30 rounded-xl shadow-2xl py-1">
                          {!["cancelled", "completed"].includes(job.status) && (
                            <button onClick={() => { handleCancel(job.id); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/[0.07] transition-colors">
                              <RefreshCw className="h-4 w-4" /> Annuler
                            </button>
                          )}
                          <button onClick={() => { handleDelete(job.id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/[0.07] transition-colors">
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
