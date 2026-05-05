"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Save, Loader2, AlertCircle } from "lucide-react";
import { QuoteItemRow } from "@/components/quotes/quote-item-row";
import { QuoteTotalsCard } from "@/components/quotes/quote-totals-card";
import { QuoteTaxModeSelector } from "@/components/quotes/quote-tax-mode-selector";
import { createQuote, updateQuote } from "@/lib/quotes/actions";
import { computeTotals, type TaxMode, type QuoteItemDraft } from "@/lib/quotes/types";
import type { Quote, QuoteItem } from "@/lib/quotes/types";

interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}

interface Property {
  id: string;
  client_id: string;
  address: string;
  city: string | null;
  name: string | null;
}

interface Props {
  quote?: Quote;
  initialItems?: QuoteItem[];
  clients: Client[];
  properties: Property[];
}

const inputCls = "w-full bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/40 transition-all";
const labelCls = "text-white/50 text-xs font-medium uppercase tracking-wide block mb-1.5";

function blankItem(pos: number): QuoteItemDraft {
  return {
    id: crypto.randomUUID(),
    position: pos,
    description: "",
    long_description: "",
    quantity: 1,
    unit: "unité",
    unit_price: 0,
    tax_rate_pct: 0,
    is_optional: false,
    is_selected: true,
  };
}

function clientLabel(c: Client) {
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Client sans nom";
}

export function QuoteEditor({ quote, initialItems = [], clients, properties }: Props) {
  const router = useRouter();
  const isEdit = !!quote;

  // ── Champs principaux ────────────────────────────────────────
  const [clientId, setClientId]         = useState(quote?.client_id ?? "");
  const [propertyId, setPropertyId]     = useState(quote?.property_id ?? "");
  const [title, setTitle]               = useState(quote?.title ?? "");
  const [introMessage, setIntroMessage] = useState(quote?.intro_message ?? "");
  const [internalNotes, setInternalNotes] = useState(quote?.internal_notes ?? "");
  const [terms, setTerms]               = useState(quote?.terms ?? "");
  const [issuedAt, setIssuedAt]         = useState(
    quote?.issued_at ?? new Date().toISOString().slice(0, 10)
  );
  const [validUntil, setValidUntil]     = useState(quote?.valid_until ?? "");

  // ── Taxes & remises ─────────────────────────────────────────
  const [taxMode, setTaxMode]           = useState<TaxMode>(quote?.tax_mode ?? "qc");
  const [customTaxRate, setCustomTaxRate] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed" | null>(quote?.discount_type ?? null);
  const [discountValue, setDiscountValue] = useState(quote?.discount_value ?? 0);

  // ── Dépôt ───────────────────────────────────────────────────
  const [depositRequired, setDepositRequired] = useState(quote?.deposit_required ?? false);
  const [depositType, setDepositType]   = useState<"percent" | "fixed" | null>(quote?.deposit_type ?? null);
  const [depositValue, setDepositValue] = useState(quote?.deposit_value ?? 0);

  // ── Items ───────────────────────────────────────────────────
  const [items, setItems] = useState<QuoteItemDraft[]>(
    initialItems.length > 0
      ? initialItems.map((it) => ({
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
        }))
      : [blankItem(0)]
  );

  // ── Sauvegarde ──────────────────────────────────────────────
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  // ── Propriétés filtrées ─────────────────────────────────────
  const clientProperties = properties.filter((p) => p.client_id === clientId);

  // ── Totaux live ─────────────────────────────────────────────
  const totals = computeTotals(
    items,
    discountType,
    discountValue,
    taxMode,
    customTaxRate,
    depositRequired,
    depositType,
    depositValue,
  );

  // ── Auto-save draft (debounced 5s) ──────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (!isEdit) return; // pas d'auto-save sur "new" (pas encore d'id)
    isDirty.current = true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (isDirty.current) doSave(true);
    }, 5000);
  }, [isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  // ── Items helpers ────────────────────────────────────────────
  function addItem() {
    setItems((prev) => [...prev, blankItem(prev.length)]);
    triggerAutoSave();
  }

  function updateItem(index: number, updated: QuoteItemDraft) {
    setItems((prev) => prev.map((it, i) => (i === index ? updated : it)));
    triggerAutoSave();
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, position: i })));
    triggerAutoSave();
  }

  function moveItem(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    setItems((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr.map((it, i) => ({ ...it, position: i }));
    });
    triggerAutoSave();
  }

  // ── Sauvegarde principale ────────────────────────────────────
  async function doSave(silent = false) {
    if (!clientId) { setSaveError("Sélectionnez un client."); return; }
    if (items.every((it) => !it.description)) { setSaveError("Ajoutez au moins un item avec une description."); return; }

    if (!silent) setSaving(true);
    setSaveError("");
    isDirty.current = false;

    const payload = {
      client_id: clientId,
      property_id: propertyId || null,
      title: title || undefined,
      intro_message: introMessage || undefined,
      internal_notes: internalNotes || undefined,
      terms: terms || undefined,
      issued_at: issuedAt || undefined,
      valid_until: validUntil || undefined,
      currency: quote?.currency ?? "CAD",
      tax_mode: taxMode,
      discount_type: discountType,
      discount_value: discountValue,
      deposit_required: depositRequired,
      deposit_type: depositType,
      deposit_value: depositValue,
      items: items.filter((it) => it.description).map((it, idx) => ({ ...it, position: idx })),
    };

    try {
      if (isEdit) {
        await updateQuote(quote!.id, payload);
      } else {
        const { quoteId } = await createQuote(payload);
        router.push(`/quotes/${quoteId}`);
        return;
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      if (!silent) setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* ── Colonne principale ── */}
      <div className="xl:col-span-2 space-y-5">

        {/* En-tête */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider text-white/50">Informations générales</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div className="md:col-span-2">
              <label className={labelCls}>Client *</label>
              <select
                value={clientId}
                onChange={(e) => { setClientId(e.target.value); setPropertyId(""); triggerAutoSave(); }}
                className={inputCls + " appearance-none"}
              >
                <option value="" className="bg-[#0d1f10]">— Sélectionner un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0d1f10]">{clientLabel(c)}</option>
                ))}
              </select>
            </div>

            {/* Propriété */}
            {clientProperties.length > 0 && (
              <div className="md:col-span-2">
                <label className={labelCls}>Propriété / Adresse de service</label>
                <select
                  value={propertyId}
                  onChange={(e) => { setPropertyId(e.target.value); triggerAutoSave(); }}
                  className={inputCls + " appearance-none"}
                >
                  <option value="" className="bg-[#0d1f10]">— Adresse du client —</option>
                  {clientProperties.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0d1f10]">
                      {p.name ? `${p.name} — ` : ""}{p.address}{p.city ? `, ${p.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Titre */}
            <div className="md:col-span-2">
              <label className={labelCls}>Titre du devis</label>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); triggerAutoSave(); }}
                placeholder="ex: Installation système chauffage"
                className={inputCls}
              />
            </div>

            {/* Dates */}
            <div>
              <label className={labelCls}>Date d'émission</label>
              <input type="date" value={issuedAt} onChange={(e) => { setIssuedAt(e.target.value); triggerAutoSave(); }} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valide jusqu'au</label>
              <input type="date" value={validUntil} onChange={(e) => { setValidUntil(e.target.value); triggerAutoSave(); }} className={inputCls} />
            </div>

            {/* Message intro */}
            <div className="md:col-span-2">
              <label className={labelCls}>Message d'introduction (visible par le client)</label>
              <textarea
                value={introMessage}
                onChange={(e) => { setIntroMessage(e.target.value); triggerAutoSave(); }}
                placeholder="Merci de votre confiance. Voici notre proposition..."
                rows={3}
                className={inputCls + " resize-none"}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Items</h3>
            <div className="text-white/25 text-xs hidden md:block">
              Desc · Qté · Prix unit. · Total
            </div>
          </div>

          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <QuoteItemRow
                item={item}
                index={idx}
                total={items.length}
                onChange={(updated) => updateItem(idx, updated)}
                onRemove={() => removeItem(idx)}
                onMoveUp={() => moveItem(idx, -1)}
                onMoveDown={() => moveItem(idx, 1)}
              />
            </motion.div>
          ))}

          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-emerald-900/30 text-white/30 hover:text-emerald-400 hover:border-emerald-700/40 transition-all text-sm"
          >
            <Plus className="h-4 w-4" /> Ajouter un item
          </button>
        </div>

        {/* Notes internes + conditions */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Notes & conditions</h3>
          <div>
            <label className={labelCls}>Notes internes (non visibles par le client)</label>
            <textarea
              value={internalNotes}
              onChange={(e) => { setInternalNotes(e.target.value); triggerAutoSave(); }}
              placeholder="Notes pour votre équipe..."
              rows={2}
              className={inputCls + " resize-none"}
            />
          </div>
          <div>
            <label className={labelCls}>Conditions générales</label>
            <textarea
              value={terms}
              onChange={(e) => { setTerms(e.target.value); triggerAutoSave(); }}
              placeholder="Paiement dû dans les 30 jours. Garantie de 1 an sur la main-d'œuvre..."
              rows={3}
              className={inputCls + " resize-none"}
            />
          </div>
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div className="space-y-5">

        {/* Erreur */}
        {saveError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {saveError}
          </div>
        )}

        {/* Totaux */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Totaux</h3>

          {/* Mode taxe */}
          <div>
            <label className={labelCls}>Régime de taxes</label>
            <QuoteTaxModeSelector
              value={taxMode}
              onChange={(m) => { setTaxMode(m); triggerAutoSave(); }}
              customRate={customTaxRate}
              onCustomRateChange={(r) => { setCustomTaxRate(r); triggerAutoSave(); }}
            />
          </div>

          {/* Remise */}
          <div>
            <label className={labelCls}>Remise</label>
            <div className="flex gap-2">
              <select
                value={discountType ?? ""}
                onChange={(e) => { setDiscountType((e.target.value as "percent" | "fixed") || null); triggerAutoSave(); }}
                className={inputCls + " appearance-none flex-1"}
              >
                <option value="" className="bg-[#0d1f10]">Aucune</option>
                <option value="percent" className="bg-[#0d1f10]">%</option>
                <option value="fixed" className="bg-[#0d1f10]">$ fixe</option>
              </select>
              {discountType && (
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={discountValue}
                  onChange={(e) => { setDiscountValue(parseFloat(e.target.value) || 0); triggerAutoSave(); }}
                  className={inputCls + " w-24"}
                />
              )}
            </div>
          </div>

          <QuoteTotalsCard
            subtotal={totals.subtotal}
            discountAmount={totals.discountAmount}
            discountType={discountType}
            discountValue={discountValue}
            taxMode={taxMode}
            taxTotal={totals.taxTotal}
            total={totals.total}
            depositRequired={depositRequired}
            depositAmount={totals.depositAmount}
          />

          {/* Dépôt */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={depositRequired}
                onChange={(e) => { setDepositRequired(e.target.checked); triggerAutoSave(); }}
                className="accent-emerald-500"
              />
              <span className="text-white/60 text-sm">Dépôt requis</span>
            </label>
            {depositRequired && (
              <div className="flex gap-2">
                <select
                  value={depositType ?? ""}
                  onChange={(e) => { setDepositType((e.target.value as "percent" | "fixed") || null); triggerAutoSave(); }}
                  className={inputCls + " appearance-none flex-1"}
                >
                  <option value="" className="bg-[#0d1f10]">Type</option>
                  <option value="percent" className="bg-[#0d1f10]">%</option>
                  <option value="fixed" className="bg-[#0d1f10]">$ fixe</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={depositValue}
                  onChange={(e) => { setDepositValue(parseFloat(e.target.value) || 0); triggerAutoSave(); }}
                  className={inputCls + " w-24"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => doSave(false)}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le devis"}
        </motion.button>

        {isEdit && (
          <p className="text-white/20 text-xs text-center">
            Sauvegarde automatique toutes les 5 secondes
          </p>
        )}
      </div>
    </div>
  );
}
