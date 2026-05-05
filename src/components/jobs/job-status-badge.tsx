import type { JobStatus, VisitStatus } from "@/lib/jobs/types";

const JOB_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  draft:       { label: "Brouillon",    className: "bg-white/[0.06] text-white/50 border-white/[0.08]" },
  scheduled:   { label: "Planifié",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "En cours",    className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  completed:   { label: "Complété",    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled:   { label: "Annulé",     className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  archived:    { label: "Archivé",    className: "bg-white/[0.04] text-white/30 border-white/[0.06]" },
};

const VISIT_CONFIG: Record<VisitStatus, { label: string; className: string }> = {
  scheduled:   { label: "Planifiée",  className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  en_route:    { label: "En route",   className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  in_progress: { label: "En cours",   className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  completed:   { label: "Complétée",  className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled:   { label: "Annulée",   className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  rescheduled: { label: "Reportée",  className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  no_show:     { label: "Absent",    className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, className } = JOB_CONFIG[status] ?? JOB_CONFIG.draft;
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const { label, className } = VISIT_CONFIG[status] ?? VISIT_CONFIG.scheduled;
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}
