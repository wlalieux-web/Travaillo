import type { QuoteStatus } from "@/lib/quotes/types";

const CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  draft:     { label: "Brouillon",  className: "bg-white/[0.06] text-white/50 border-white/[0.08]" },
  sent:      { label: "Envoyé",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  viewed:    { label: "Vu",        className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  approved:  { label: "Approuvé",  className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected:  { label: "Refusé",   className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  expired:   { label: "Expiré",   className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  converted: { label: "Converti", className: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  archived:  { label: "Archivé",  className: "bg-white/[0.04] text-white/30 border-white/[0.06]" },
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.draft;
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}
