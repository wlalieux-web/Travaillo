"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Logistique Boréal a transformé notre cycle de vente. On a réduit notre time-to-close de 6 semaines à 2. Incroyable.",
    author: "Sophie Marchand",
    role: "VP Ventes, Thermatech Inc.",
    avatar: "S",
    color: "from-emerald-500 to-teal-600",
  },
  {
    quote: "L'IA qui prédit les churns m'a sauvé 3 gros comptes le mois dernier. Seul outil CRM que je recommanderais sans hésiter.",
    author: "Antoine Rousseau",
    role: "Directeur Opérations, NordService",
    avatar: "A",
    color: "from-teal-500 to-cyan-600",
  },
  {
    quote: "En 2 semaines d'onboarding, notre équipe de 50 techniciens était 100% opérationnelle. La migration depuis l'ancien système était transparente.",
    author: "Camille Dufort",
    role: "CRO, Momentum Québec",
    avatar: "C",
    color: "from-cyan-500 to-emerald-600",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-32 bg-[#020c05] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/10 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-teal-400 text-sm uppercase tracking-[0.2em] font-semibold mb-4">Témoignages</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Ils ont choisi{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
              Logistique Boréal
            </span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="relative rounded-2xl border border-emerald-900/30 bg-white/[0.02] p-8 overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-950/20 to-transparent" />
              <Quote className="h-6 w-6 text-white/15 mb-6" />
              <p className="text-white/70 text-base leading-relaxed mb-8 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.author}</div>
                  <div className="text-white/40 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
