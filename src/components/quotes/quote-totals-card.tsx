"use client";

import { TAX_PRESETS, type TaxMode } from "@/lib/quotes/types";

interface Props {
  subtotal: number;
  discountAmount: number;
  discountType: "percent" | "fixed" | null;
  discountValue: number;
  taxMode: TaxMode;
  taxTotal: number;
  total: number;
  depositRequired: boolean;
  depositAmount: number;
  currency?: string;
}

function fmt(n: number, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(n);
}

export function QuoteTotalsCard({
  subtotal, discountAmount, discountType, discountValue,
  taxMode, taxTotal, total, depositRequired, depositAmount, currency = "CAD",
}: Props) {
  const taxLines = TAX_PRESETS[taxMode];

  return (
    <div className="bg-white/[0.02] border border-emerald-900/20 rounded-xl p-5 space-y-2.5 text-sm">
      <div className="flex justify-between text-white/50">
        <span>Sous-total</span>
        <span className="tabular-nums">{fmt(subtotal, currency)}</span>
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-amber-400">
          <span>
            Rabais{" "}
            {discountType === "percent" ? `(${discountValue}%)` : ""}
          </span>
          <span className="tabular-nums">−{fmt(discountAmount, currency)}</span>
        </div>
      )}

      {taxMode !== "none" && taxLines.length > 0 && (
        taxLines.map((t) => {
          const lineAmt = (subtotal - discountAmount) * (t.rate / 100);
          return (
            <div key={t.label} className="flex justify-between text-white/40">
              <span>{t.label} ({t.rate}%)</span>
              <span className="tabular-nums">{fmt(lineAmt, currency)}</span>
            </div>
          );
        })
      )}

      {taxMode === "custom" && taxTotal > 0 && (
        <div className="flex justify-between text-white/40">
          <span>Taxe personnalisée</span>
          <span className="tabular-nums">{fmt(taxTotal, currency)}</span>
        </div>
      )}

      <div className="border-t border-emerald-900/20 pt-2.5 flex justify-between text-white font-bold text-base">
        <span>Total</span>
        <span className="tabular-nums text-emerald-300">{fmt(total, currency)}</span>
      </div>

      {depositRequired && depositAmount > 0 && (
        <div className="border-t border-emerald-900/20 pt-2.5 flex justify-between text-white/60 text-xs">
          <span>Dépôt requis</span>
          <span className="tabular-nums text-amber-400">{fmt(depositAmount, currency)}</span>
        </div>
      )}
    </div>
  );
}
