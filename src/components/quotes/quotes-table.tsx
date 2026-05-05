"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight, FileText, Plus, MoreVertical, Copy, Trash2 } from "lucide-react";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { deleteQuote, duplicateQuote } from "@/lib/quotes/actions";
import type { Quote } from "@/lib/quotes/types";

type QuoteWithClient = Quote & {
  clients: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
};

const STATUS_FILTERS = [
  { value: "", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "sent", label: "Envoyés" },
  { value: "viewed", label: "Vus" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Refusés" },
];

function clientName(q: QuoteWithClient) {
  if (!q.clients) return "—";
  if (q.clients.company_name) return q.clients.company_name;
  return [q.clients.first_name, q.clients.last_name].filter(Boolean).join(" ") || "—";
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

export function QuotesTable({ quotes, total }: { quotes: QuoteWithClient[]; total: number }) {
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

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce devis définitivement ?")) return;
    await deleteQuote(id);
    router.refresh();
  }

  async function handleDuplicate(id: string) {
    const { quoteId } = await duplicateQuote(id);
    router.push(`/quotes/${quoteId}`);
  }

  const activeStatus = searchParams.get("status") ?? "";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); applyFilter("q", search); }}
          className="relative flex-1"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro ou client..."
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

      <p className="text-white/30 text-sm">{total} devis</p>

      {/* Empty state */}
      {quotes.length === 0 ? (
        <div className="rounded-xl border border-emerald-900/20 bg-white/[0.02] p-16 text-center">
          <FileText className="h-12 w-12 text-white/15 mx-auto mb-4" />
          <p className="text-white/40 text-sm mb-5">
            {search ? `Aucun résultat pour "${search}"` : "Aucun devis pour l'instant."}
          </p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors"
          >
            <Plus className="h-4 w-4" /> Créer un devis
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-900/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-emerald-900/20 bg-white/[0.02]">
                {["Numéro", "Client", "Date", "Valide jusqu'au", "Statut", "Total", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider ${
                      i >= 2 && i <= 3 ? "hidden md:table-cell" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, i) => (
                <motion.tr
                  key={q.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-emerald-900/10 last:border-0 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/quotes/${q.id}`)}
                >
                  <td className="px-5 py-4">
                    <span className="text-emerald-400 font-mono text-sm font-semibold">{q.number}</span>
                    {q.title && <div className="text-white/30 text-xs mt-0.5 truncate max-w-[140px]">{q.title}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/80 text-sm">{clientName(q)}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/40 text-sm">
                      {q.issued_at ? new Date(q.issued_at).toLocaleDateString("fr-CA") : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-sm ${
                      q.valid_until && new Date(q.valid_until) < new Date()
                        ? "text-rose-400"
                        : "text-white/40"
                    }`}>
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString("fr-CA") : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <QuoteStatusBadge status={q.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white font-semibold text-sm tabular-nums">{fmt(q.total)}</span>
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex justify-end">
                      <button
                        onClick={() => setMenuOpen(menuOpen === q.id ? null : q.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === q.id && (
                        <div className="absolute right-0 top-9 z-20 w-44 bg-[#0d1f10] border border-emerald-900/30 rounded-xl shadow-2xl py-1">
                          <button
                            onClick={() => { handleDuplicate(q.id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                          >
                            <Copy className="h-4 w-4" /> Dupliquer
                          </button>
                          <button
                            onClick={() => { handleDelete(q.id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/[0.07] transition-colors"
                          >
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
