"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, FileText, DollarSign } from "lucide-react";

interface Props {
  clientCount: number;
  activeCount: number;
}

export function DashboardStats({ clientCount, activeCount }: Props) {
  const stats = [
    {
      label: "Total clients",
      value: clientCount,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Clients actifs",
      value: activeCount,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Devis en attente",
      value: 0,
      icon: FileText,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "À facturer",
      value: 0,
      suffix: "$",
      icon: DollarSign,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className={`rounded-xl border ${s.border} bg-white/[0.03] p-5`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-sm">{s.label}</span>
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {s.suffix}{s.value.toLocaleString("fr-CA")}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
