"use client";

import { ChevronUp, ChevronDown, Trash2, GripVertical } from "lucide-react";
import type { QuoteItemDraft } from "@/lib/quotes/types";

interface Props {
  item: QuoteItemDraft;
  index: number;
  total: number;
  onChange: (updated: QuoteItemDraft) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const inputCls = "bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-all w-full";

export function QuoteItemRow({ item, index, total, onChange, onRemove, onMoveUp, onMoveDown }: Props) {
  const lineTotal = item.quantity * item.unit_price;

  function fmt(n: number) {
    return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
  }

  return (
    <div className="group grid grid-cols-12 gap-2 items-start p-3 rounded-xl border border-emerald-900/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-emerald-900/25 transition-all">
      {/* Poignée + ordre */}
      <div className="col-span-1 flex flex-col items-center gap-0.5 pt-2">
        <GripVertical className="h-4 w-4 text-white/15" />
        <span className="text-white/20 text-xs">{index + 1}</span>
      </div>

      {/* Description */}
      <div className="col-span-5">
        <input
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="Description du service ou produit"
          className={inputCls}
        />
        <textarea
          value={item.long_description}
          onChange={(e) => onChange({ ...item, long_description: e.target.value })}
          placeholder="Détails (optionnel)"
          rows={1}
          className={`${inputCls} mt-1 resize-none text-xs text-white/50`}
        />
      </div>

      {/* Qté */}
      <div className="col-span-1">
        <input
          type="number"
          min={0}
          step={0.01}
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
          className={inputCls + " text-center"}
        />
        <div className="text-white/25 text-[10px] text-center mt-1">{item.unit}</div>
      </div>

      {/* Prix unitaire */}
      <div className="col-span-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">$</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.unit_price}
            onChange={(e) => onChange({ ...item, unit_price: parseFloat(e.target.value) || 0 })}
            className={inputCls + " pl-6"}
          />
        </div>
      </div>

      {/* Total ligne */}
      <div className="col-span-2 flex items-center justify-end pt-2">
        <span className="text-white/70 text-sm tabular-nums font-medium">{fmt(lineTotal)}</span>
      </div>

      {/* Actions */}
      <div className="col-span-1 flex flex-col items-center gap-1 pt-1">
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onMoveUp} disabled={index === 0} className="text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRemove} className="text-white/30 hover:text-rose-400 transition-colors mt-0.5">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Optionnel toggle */}
        <button
          onClick={() => onChange({ ...item, is_optional: !item.is_optional })}
          title={item.is_optional ? "Optionnel (cliquer pour rendre obligatoire)" : "Obligatoire (cliquer pour rendre optionnel)"}
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-all mt-1 ${
            item.is_optional
              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
              : "text-white/20 border-white/[0.06] bg-transparent"
          }`}
        >
          OPT
        </button>
      </div>
    </div>
  );
}
