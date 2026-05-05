"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Send, Copy, Trash2, CalendarPlus, Clock,
  Eye, CheckCircle2, XCircle, FileText,
} from "lucide-react";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { SendQuoteDialog } from "@/components/quotes/send-quote-dialog";
import { deleteQuote, duplicateQuote } from "@/lib/quotes/actions";
import type { Quote } from "@/lib/quotes/types";

interface Props { quote: Quote }

function fmt(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" });
}

export function QuoteDetailSidebar({ quote }: Props) {
  const router = useRouter();
  const [showSend, setShowSend] = useState(false);

  async function handleDelete() {
    if (!confirm(`Supprimer le devis ${quote.number} définitivement ?`)) return;
    await deleteQuote(quote.id);
    router.push("/quotes");
  }

  async function handleDuplicate() {
    const { quoteId } = await duplicateQuote(quote.id);
    router.push(`/quotes/${quoteId}`);
  }

  const timeline = [
    { label: "Créé", date: quote.created_at, icon: FileText, color: "text-white/40" },
    { label: "Envoyé", date: null, icon: Send, color: "text-blue-400" },
    { label: "Vu", date: quote.viewed_at, icon: Eye, color: "text-violet-400" },
    { label: "Répondu", date: quote.responded_at, icon: quote.status === "approved" ? CheckCircle2 : XCircle, color: quote.status === "approved" ? "text-emerald-400" : "text-rose-400" },
  ].filter((e) => e.date || e.label === "Créé");

  return (
    <div className="space-y-4">
      {/* Statut + résumé */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Statut</span>
          <QuoteStatusBadge status={quote.status} />
        </div>

        <div className="space-y-2 text-sm">
          {[
            { label: "Numéro", value: quote.number, mono: true },
            { label: "Total", value: fmt(quote.total), bold: true },
            { label: "Émis le", value: fmtDate(quote.issued_at) },
            { label: "Valide jusqu'au", value: fmtDate(quote.valid_until) },
            ...(quote.deposit_required
              ? [{ label: "Dépôt", value: fmt(quote.deposit_amount) }]
              : []),
            ...(quote.signed_name
              ? [{ label: "Signé par", value: quote.signed_name }]
              : []),
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <span className="text-white/35">{row.label}</span>
              <span className={`${row.bold ? "text-emerald-300 font-bold" : "text-white/70"} ${row.mono ? "font-mono text-emerald-400" : ""} text-right`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5 space-y-2">
        <span className="text-white/50 text-xs uppercase tracking-wider font-medium block mb-3">Actions</span>

        {/* Envoyer */}
        {["draft", "sent", "viewed"].includes(quote.status) && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowSend(true)}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600/80 to-blue-700/80 text-white text-sm font-semibold hover:from-blue-500/80 hover:to-blue-600/80 transition-all"
          >
            <Send className="h-4 w-4" />
            {quote.status === "draft" ? "Envoyer au client" : "Partager le lien"}
          </motion.button>
        )}

        {/* Convertir en job (disabled) */}
        <div title="Disponible dans le Module Jobs">
          <button
            disabled
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/25 text-sm cursor-not-allowed"
          >
            <CalendarPlus className="h-4 w-4" />
            Convertir en job
            <span className="ml-auto text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded">Bientôt</span>
          </button>
        </div>

        {/* Dupliquer */}
        <button
          onClick={handleDuplicate}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-emerald-900/20 text-white/60 text-sm hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <Copy className="h-4 w-4" /> Dupliquer
        </button>

        {/* Supprimer */}
        <button
          onClick={handleDelete}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-rose-400/70 text-sm hover:text-rose-400 hover:bg-rose-500/[0.07] transition-all"
        >
          <Trash2 className="h-4 w-4" /> Supprimer
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5">
        <span className="text-white/50 text-xs uppercase tracking-wider font-medium block mb-4">Historique</span>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-white/60 text-xs font-medium">Créé</div>
              <div className="text-white/30 text-xs">{fmtDate(quote.created_at)}</div>
            </div>
          </div>
          {quote.viewed_at && (
            <div className="flex items-start gap-3">
              <Eye className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white/60 text-xs font-medium">Vu par le client</div>
                <div className="text-white/30 text-xs">{fmtDate(quote.viewed_at)}</div>
              </div>
            </div>
          )}
          {quote.signed_at && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white/60 text-xs font-medium">Approuvé par {quote.signed_name}</div>
                <div className="text-white/30 text-xs">{fmtDate(quote.signed_at)}</div>
              </div>
            </div>
          )}
          {quote.responded_at && quote.status === "rejected" && (
            <div className="flex items-start gap-3">
              <XCircle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white/60 text-xs font-medium">Refusé</div>
                <div className="text-white/30 text-xs">{fmtDate(quote.responded_at)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSend && (
        <SendQuoteDialog
          quoteId={quote.id}
          quoteNumber={quote.number}
          currentToken={quote.public_token}
          currentStatus={quote.status}
          onClose={() => setShowSend(false)}
        />
      )}
    </div>
  );
}
