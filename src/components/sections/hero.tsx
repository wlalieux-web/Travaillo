"use client";

import { motion } from "framer-motion";
import { ArrowRight, Leaf } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.5 + i * 0.2,
      ease: "easeOut" as const,
    },
  }),
};

export function Hero() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020c05]">
      {/* Shader background — full bleed */}
      <ShaderAnimation />

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-[#020c05]/60" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.2) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-10"
          >
            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm text-emerald-300 tracking-wide font-medium">
              La plateforme CRM #1 pour les services terrain
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tight leading-[0.9]">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/75">
                Gérez vos équipes
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                sur le terrain
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-lg sm:text-xl text-white/50 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
              Logistique Boréal unifie devis, planification, facturation et suivi
              d'équipe dans une seule plateforme — conçue pour les entreprises
              de services à domicile du Québec.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-base shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-shadow"
            >
              Démarrer gratuitement
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-base hover:bg-white/10 transition-colors"
            >
              Voir la démo
            </motion.button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-12 flex items-center justify-center gap-2 text-white/30 text-sm"
          >
            <div className="flex -space-x-2">
              {["V", "M", "A", "J", "L"].map((initial, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-[#020c05] flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: `hsl(${145 + i * 15}, 60%, 40%)` }}
                >
                  {initial}
                </div>
              ))}
            </div>
            <span>Rejoint par +12 000 équipes au Québec</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020c05] via-transparent to-[#020c05]/40 pointer-events-none" />
    </div>
  );
}
