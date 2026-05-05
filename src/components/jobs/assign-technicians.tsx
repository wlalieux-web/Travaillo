"use client";

import { Users, X, Check } from "lucide-react";
import { useState } from "react";

interface Technician {
  id: string;
  first_name: string | null;
  last_name: string | null;
  color: string;
  avatar_url: string | null;
}

interface Props {
  technicians: Technician[];
  selected: string[];
  primaryId?: string | null;
  onChange: (ids: string[], primaryId: string | null) => void;
}

function initials(t: Technician) {
  return `${t.first_name?.[0] ?? ""}${t.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

function fullName(t: Technician) {
  return [t.first_name, t.last_name].filter(Boolean).join(" ") || "Technicien";
}

export function AssignTechnicians({ technicians, selected, primaryId, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    const primary: string | null = next.length > 0 ? (next.includes(primaryId ?? "") ? (primaryId ?? next[0]) : next[0]) : null;
    onChange(next, primary);
  }

  function setPrimary(id: string) {
    if (!selected.includes(id)) return;
    onChange(selected, id);
  }

  return (
    <div className="space-y-2">
      {/* Techniciens sélectionnés */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const tech = technicians.find((t) => t.id === id);
            if (!tech) return null;
            return (
              <div key={id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-900/30 bg-emerald-950/20">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: tech.color }}
                >
                  {initials(tech)}
                </div>
                <span className="text-white/70 text-xs">{fullName(tech)}</span>
                {id === primaryId && (
                  <span className="text-emerald-400 text-[10px] font-semibold">Principal</span>
                )}
                <button onClick={() => toggle(id)} className="text-white/30 hover:text-white/60 ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton d'ouverture */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-900/20 bg-white/[0.03] text-white/50 text-sm hover:border-emerald-700/30 hover:text-white/70 transition-all"
      >
        <Users className="h-4 w-4" />
        {selected.length === 0 ? "Assigner des techniciens" : `${selected.length} assigné${selected.length > 1 ? "s" : ""}`}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="rounded-xl border border-emerald-900/20 bg-[#0d1f10] shadow-2xl overflow-hidden">
          {technicians.length === 0 ? (
            <p className="px-4 py-3 text-white/30 text-sm">Aucun technicien disponible</p>
          ) : (
            technicians.map((tech) => {
              const isSelected = selected.includes(tech.id);
              const isPrimary = tech.id === primaryId;
              return (
                <div key={tech.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-emerald-900/10 last:border-0">
                  <button type="button" onClick={() => toggle(tech.id)} className="flex items-center gap-3 flex-1 text-left">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: tech.color }}
                    >
                      {initials(tech)}
                    </div>
                    <span className="text-white/70 text-sm">{fullName(tech)}</span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-400 ml-auto" />}
                  </button>
                  {isSelected && !isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(tech.id)}
                      className="text-white/25 hover:text-emerald-400 text-xs transition-colors"
                    >
                      Principal
                    </button>
                  )}
                  {isPrimary && <span className="text-emerald-400 text-xs font-semibold">Principal</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
