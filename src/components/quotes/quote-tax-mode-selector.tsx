"use client";

import { TAX_PRESETS, type TaxMode } from "@/lib/quotes/types";

const OPTIONS: { value: TaxMode; label: string }[] = [
  { value: "qc",     label: "QC — TPS (5%) + TVQ (9.975%)" },
  { value: "eu",     label: "UE — TVA (20%)" },
  { value: "us",     label: "US — Sales Tax (8.5%)" },
  { value: "none",   label: "Sans taxe" },
  { value: "custom", label: "Taux personnalisé" },
];

interface Props {
  value: TaxMode;
  onChange: (mode: TaxMode) => void;
  customRate?: number;
  onCustomRateChange?: (rate: number) => void;
}

export function QuoteTaxModeSelector({ value, onChange, customRate = 0, onCustomRateChange }: Props) {
  const preview = TAX_PRESETS[value];

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TaxMode)}
        className="w-full bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-all appearance-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0d1f10]">
            {o.label}
          </option>
        ))}
      </select>

      {/* Preview des lignes de taxe */}
      {value !== "none" && (
        <div className="space-y-1">
          {value === "custom" ? (
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">Taux (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.001}
                value={customRate}
                onChange={(e) => onCustomRateChange?.(parseFloat(e.target.value) || 0)}
                className="w-24 bg-white/[0.04] border border-emerald-900/20 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500/40"
              />
            </div>
          ) : (
            preview.map((t) => (
              <div key={t.label} className="flex items-center justify-between text-xs text-white/35">
                <span>{t.label}</span>
                <span>{t.rate}%</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
