"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight } from "lucide-react";

const metrics = [
  { label: "MRR", value: "€142K", change: "+18%", icon: DollarSign, color: "text-emerald-400" },
  { label: "Clients actifs", value: "2 847", change: "+12%", icon: Users, color: "text-teal-400" },
  { label: "Taux de conversion", value: "24.8%", change: "+5%", icon: TrendingUp, color: "text-cyan-400" },
  { label: "NPS Score", value: "72", change: "+4pts", icon: Activity, color: "text-emerald-300" },
];

const pipeline = [
  { stage: "Prospects", count: 142, amount: "€890K", pct: 100 },
  { stage: "Qualifiés", count: 87, amount: "€620K", pct: 70 },
  { stage: "Démo faite", count: 54, amount: "€440K", pct: 49 },
  { stage: "Proposition", count: 31, amount: "€280K", pct: 31 },
  { stage: "Négociation", count: 14, amount: "€160K", pct: 18 },
];

const recentDeals = [
  { company: "Thermatech", contact: "Sophie M.", amount: "€24 000", status: "Gagné", color: "bg-emerald-500" },
  { company: "NordService", contact: "Antoine R.", amount: "€18 500", status: "En cours", color: "bg-teal-500" },
  { company: "Momentum QC", contact: "Camille D.", amount: "€42 000", status: "Proposition", color: "bg-cyan-500" },
  { company: "Boréal HVAC", contact: "Lucas B.", amount: "€9 800", status: "Gagné", color: "bg-emerald-500" },
];

export function DashboardPreview() {
  return (
    <section className="py-32 bg-[#020c05] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-emerald-400 text-sm uppercase tracking-[0.2em] font-semibold mb-4">Interface</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Un dashboard pensé pour{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              la performance
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Visualisez votre pipeline, vos KPIs et l'activité de vos équipes en temps réel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative rounded-2xl border border-emerald-900/30 bg-[#030f06] overflow-hidden shadow-[0_40px_120px_rgba(16,185,129,0.1)]"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-900/20 bg-white/[0.01]">
            <div className="w-3 h-3 rounded-full bg-rose-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <div className="mx-auto flex items-center gap-2 px-4 py-1 rounded-md bg-white/[0.03] text-white/30 text-xs">
              app.logistiqueboreal.ca/dashboard
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {metrics.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.3 }}
                    className="rounded-xl border border-emerald-900/20 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/30 text-xs">{m.label}</span>
                      <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                    </div>
                    <div className="text-white font-bold text-lg">{m.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 text-xs">{m.change}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pipeline */}
              <div className="rounded-xl border border-emerald-900/20 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold text-sm">Pipeline de ventes</h3>
                  <span className="text-white/30 text-xs">Ce trimestre</span>
                </div>
                <div className="space-y-3">
                  {pipeline.map((stage, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 + 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/50 text-xs">{stage.stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white/30 text-xs">{stage.count} deals</span>
                          <span className="text-white/60 text-xs font-medium">{stage.amount}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stage.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 + 0.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent deals */}
            <div className="rounded-xl border border-emerald-900/20 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-sm">Deals récents</h3>
                <button className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors">Voir tout →</button>
              </div>
              <div className="space-y-4">
                {recentDeals.map((deal, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.4 }}
                    className="flex items-center gap-3 py-2 border-b border-emerald-900/10 last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full ${deal.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{deal.company}</div>
                      <div className="text-white/30 text-[11px]">{deal.contact}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white text-xs font-semibold">{deal.amount}</div>
                      <div className="text-white/30 text-[11px]">{deal.status}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-900/10">
                <div className="text-white/30 text-xs mb-3">Activité cette semaine</div>
                <div className="flex items-end gap-1 h-14">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.06 + 0.5 }}
                      className="flex-1 rounded-sm bg-gradient-to-t from-emerald-700/70 to-teal-500/30"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <span key={i} className="text-white/20 text-[10px] flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
