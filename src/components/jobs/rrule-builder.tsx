"use client";

import { useState, useEffect } from "react";

type Freq = "DAILY" | "WEEKLY" | "MONTHLY";
const DAYS = [
  { key: "MO", label: "L" },
  { key: "TU", label: "M" },
  { key: "WE", label: "M" },
  { key: "TH", label: "J" },
  { key: "FR", label: "V" },
  { key: "SA", label: "S" },
  { key: "SU", label: "D" },
];

interface Props {
  value: string;
  onChange: (rule: string) => void;
}

export function RruleBuilder({ value, onChange }: Props) {
  const [freq, setFreq] = useState<Freq>("WEEKLY");
  const [interval, setInterval] = useState(1);
  const [byDay, setByDay] = useState<string[]>(["MO"]);

  // Parser la valeur initiale
  useEffect(() => {
    if (!value) return;
    const freqMatch = value.match(/FREQ=(\w+)/);
    const intervalMatch = value.match(/INTERVAL=(\d+)/);
    const byDayMatch = value.match(/BYDAY=([\w,]+)/);
    if (freqMatch) setFreq(freqMatch[1] as Freq);
    if (intervalMatch) setInterval(parseInt(intervalMatch[1]));
    if (byDayMatch) setByDay(byDayMatch[1].split(","));
  }, []);

  useEffect(() => {
    let rule = `FREQ=${freq};INTERVAL=${interval}`;
    if (freq === "WEEKLY" && byDay.length > 0) rule += `;BYDAY=${byDay.join(",")}`;
    onChange(rule);
  }, [freq, interval, byDay]);

  function toggleDay(key: string) {
    setByDay((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  const freqLabel = { DAILY: "jour(s)", WEEKLY: "semaine(s)", MONTHLY: "mois" };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-emerald-900/20">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-white/50 text-sm">Tous les</span>
        <input
          type="number"
          min={1}
          max={52}
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
          className="w-16 bg-white/[0.06] border border-emerald-900/20 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-emerald-500/40"
        />
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value as Freq)}
          className="bg-white/[0.06] border border-emerald-900/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/40 appearance-none"
        >
          <option value="DAILY" className="bg-[#0d1f10]">jour(s)</option>
          <option value="WEEKLY" className="bg-[#0d1f10]">semaine(s)</option>
          <option value="MONTHLY" className="bg-[#0d1f10]">mois</option>
        </select>
      </div>

      {freq === "WEEKLY" && (
        <div>
          <p className="text-white/40 text-xs mb-2">Jours de la semaine</p>
          <div className="flex gap-1.5">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  byDay.includes(d.key)
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/30 hover:border-white/20"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-white/25 text-xs">
        Règle : <span className="font-mono text-emerald-500/60">
          {freq === "WEEKLY" ? `Tous les ${interval} ${freqLabel[freq]} (${byDay.join(", ")})` : `Tous les ${interval} ${freqLabel[freq]}`}
        </span>
      </p>
    </div>
  );
}
