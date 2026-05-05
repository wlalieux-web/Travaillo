"use client";

import { motion } from "framer-motion";
import { ArrowRight, Leaf } from "lucide-react";

export function CTA() {
  return (
    <section className="py-32 bg-[#020c05] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/30 via-teal-950/40 to-cyan-950/30" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[400px] bg-emerald-700/15 blur-[120px] rounded-full"
        />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium">Aucune carte de crédit requise</span>
          </div>

          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Prêt à prendre le{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              contrôle ?
            </span>
          </h2>

          <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Rejoignez 12 000+ équipes qui ont choisi Logistique Boréal pour transformer leur gestion terrain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:shadow-[0_0_80px_rgba(16,185,129,0.6)] transition-shadow"
            >
              Commencer gratuitement <ArrowRight className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl bg-white/[0.04] border border-emerald-900/30 text-white font-medium text-lg hover:bg-white/[0.08] transition-colors"
            >
              Planifier une démo
            </motion.button>
          </div>

          <p className="text-white/20 text-sm mt-8">
            14 jours d'essai gratuit · Aucun engagement · Migration gratuite
          </p>
        </motion.div>
      </div>
    </section>
  );
}
