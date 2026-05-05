"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Check, X, Loader2, CheckCircle2 } from "lucide-react";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { QuoteTotalsCard } from "@/components/quotes/quote-totals-card";
import { QuoteSignaturePad } from "@/components/quotes/quote-signature-pad";
import { approveQuote, rejectQuote } from "@/lib/quotes/actions";
import { computeTotals, type TaxMode } from "@/lib/quotes/types";

interface PublicItem {
  id: string;
  position: number;
  description: string;
  long_description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate_pct: number;
  is_optional: boolean;
  is_selected: boolean;
  line_total: number;
}

interface Props {
  quote: {
    id: string;
    number: string;
    status: string;
    title: string | null;
    intro_message: string | null;
    terms: string | null;
    issued_at: string | null;
    valid_until: string | null;
    currency: string;
    tax_mode: string;
    subtotal: number;
    discount_type: string | null;
    discount_value: number | null;
    discount_amount: number;
    tax_total: number;
    total: number;
    deposit_required: boolean;
    deposit_amount: number;
    public_token: string;
    signed_name: string | null;
    signed_at: string | null;
    clients: { first_name: string | null; last_name: string | null; company_name: string | null } | null;
    companies: { name: string; logo_url: string | null; phone: string | null; email: string | null; city: string | null } | null;
  };
  items: PublicItem[];
  token: string;
}

function fmt(n: number, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(n);
}

function clientName(c: Props["quote"]["clients"]) {
  if (!c) return "";
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

export function PublicQuoteView({ quote, items: initialItems, token }: Props) {
  const [items, setItems] = useState(initialItems);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(
    ["approved", "rejected"].includes(quote.status) ? (quote.status as "approved" | "rejected") : null
  );

  const canRespond = ["sent", "viewed"].includes(quote.status) && !done;

  // Sélections des optionnels
  const selectedOptionalIds = items.filter((it) => it.is_optional && it.is_selected).map((it) => it.id);

  function toggleOptional(id: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_selected: !it.is_selected } : it))
    );
  }

  // Recalcul live des totaux selon sélections client
  const drafts = items.map((it) => ({
    id: it.id,
    position: it.position,
    description: it.description,
    long_description: it.long_description ?? "",
    quantity: it.quantity,
    unit: it.unit,
    unit_price: it.unit_price,
    tax_rate_pct: it.tax_rate_pct,
    is_optional: it.is_optional,
    is_selected: it.is_selected,
  }));

  const totals = computeTotals(
    drafts,
    (quote.discount_type as "percent" | "fixed" | null),
    quote.discount_value ?? 0,
    quote.tax_mode as TaxMode,
    0,
    quote.deposit_required,
    null,
    0,
  );

  async function handleApprove() {
    if (!signedName.trim()) return;
    setSubmitting(true);
    try {
      await approveQuote(token, signedName, signatureData, selectedOptionalIds);
      setDone("approved");
      setShowSignModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setSubmitting(true);
    try {
      await rejectQuote(token);
      setDone("rejected");
      setShowRejectModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020c05]">
      {/* Header company */}
      <header className="border-b border-emerald-900/20 bg-[#030e06]">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {quote.companies?.logo_url ? (
              <img src={quote.companies.logo_url} alt="Logo" className="h-9 w-9 object-contain rounded-lg" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TreePine className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <div className="text-white font-bold text-sm">{quote.companies?.name}</div>
              {quote.companies?.city && <div className="text-white/35 text-xs">{quote.companies.city}</div>}
            </div>
          </div>
          <QuoteStatusBadge status={quote.status as any} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-8">
        {/* Done state */}
        <AnimatePresence>
          {done === "approved" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
            >
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Devis approuvé — merci !</div>
                <div className="text-sm text-emerald-400/70">Nous vous contacterons prochainement pour planifier les travaux.</div>
              </div>
            </motion.div>
          )}
          {done === "rejected" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300"
            >
              <X className="h-5 w-5 flex-shrink-0" />
              <div className="font-semibold">Devis refusé. Contactez-nous si vous souhaitez ajuster la proposition.</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* En-tête devis */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {quote.title || `Devis ${quote.number}`}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                Préparé pour <span className="text-white/70">{clientName(quote.clients)}</span>
                {quote.issued_at && (
                  <> · le {new Date(quote.issued_at).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}</>
                )}
              </p>
            </div>
            <span className="text-emerald-400 font-mono text-sm font-semibold">{quote.number}</span>
          </div>

          {quote.valid_until && (
            <p className="text-amber-400/70 text-xs">
              Ce devis est valide jusqu'au {new Date(quote.valid_until).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}.
            </p>
          )}

          {quote.intro_message && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-emerald-900/20 text-white/60 text-sm leading-relaxed">
              {quote.intro_message}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-emerald-900/20 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-white/[0.02] text-white/30 text-xs uppercase tracking-wider">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qté</div>
            <div className="col-span-2 text-right">Prix unit.</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {items.map((item, i) => (
            <div
              key={item.id}
              className={`px-5 py-4 border-b border-emerald-900/10 last:border-0 ${
                item.is_optional && !item.is_selected ? "opacity-50" : ""
              }`}
            >
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 md:col-span-6">
                  <div className="flex items-start gap-2">
                    {item.is_optional && canRespond && (
                      <button
                        onClick={() => toggleOptional(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                          item.is_selected
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-white/20 bg-transparent"
                        }`}
                      >
                        {item.is_selected && <Check className="h-3 w-3 text-white" />}
                      </button>
                    )}
                    <div>
                      <div className="text-white text-sm font-medium">{item.description}</div>
                      {item.long_description && (
                        <div className="text-white/40 text-xs mt-1 leading-relaxed">{item.long_description}</div>
                      )}
                      {item.is_optional && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10">
                          Optionnel
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-2 text-right text-white/50 text-sm">
                  {item.quantity} {item.unit}
                </div>
                <div className="col-span-4 md:col-span-2 text-right text-white/50 text-sm">
                  {fmt(item.unit_price, quote.currency)}
                </div>
                <div className="col-span-4 md:col-span-2 text-right text-white font-medium text-sm">
                  {fmt(item.quantity * item.unit_price, quote.currency)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-full md:w-80">
            <QuoteTotalsCard
              subtotal={totals.subtotal}
              discountAmount={totals.discountAmount}
              discountType={quote.discount_type as "percent" | "fixed" | null}
              discountValue={quote.discount_value ?? 0}
              taxMode={quote.tax_mode as TaxMode}
              taxTotal={totals.taxTotal}
              total={totals.total}
              depositRequired={quote.deposit_required}
              depositAmount={totals.depositAmount}
              currency={quote.currency}
            />
          </div>
        </div>

        {/* Conditions */}
        {quote.terms && (
          <div className="px-5 py-4 rounded-xl bg-white/[0.02] border border-emerald-900/20 text-white/40 text-xs leading-relaxed whitespace-pre-wrap">
            {quote.terms}
          </div>
        )}

        {/* Boutons d'action */}
        {canRespond && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-emerald-900/20">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSignModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              <Check className="h-5 w-5" /> Approuver et signer
            </motion.button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-rose-500/20 text-rose-400 font-medium text-base hover:bg-rose-500/[0.07] transition-colors"
            >
              <X className="h-5 w-5" /> Refuser
            </button>
          </div>
        )}
      </main>

      {/* Modal signature */}
      <AnimatePresence>
        {showSignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={() => setShowSignModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0d1f10] border border-emerald-900/30 rounded-2xl p-6 space-y-5"
            >
              <h3 className="text-white font-bold text-lg">Approuver le devis {quote.number}</h3>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Votre nom complet *</label>
                <input
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>

              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide block mb-2">Signature</label>
                <QuoteSignaturePad onSign={setSignatureData} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.04] transition-colors"
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleApprove}
                  disabled={submitting || !signedName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {submitting ? "Confirmation..." : "Confirmer l'approbation"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal refus */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0d1f10] border border-rose-900/30 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-white font-bold">Refuser le devis ?</h3>
              <p className="text-white/50 text-sm">
                Vous pourrez contacter l'entreprise pour ajuster la proposition.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white/50 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600/80 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Refuser
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
