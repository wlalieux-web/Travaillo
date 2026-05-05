"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "Stripe", symbol: "◈" },
  { name: "Notion", symbol: "◻" },
  { name: "Figma", symbol: "⬡" },
  { name: "Vercel", symbol: "▲" },
  { name: "Linear", symbol: "◎" },
  { name: "Slack", symbol: "✦" },
  { name: "GitHub", symbol: "⊕" },
  { name: "Intercom", symbol: "◉" },
];

export function Logos() {
  return (
    <section className="py-16 bg-[#020c05] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-900/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-900/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/25 text-sm uppercase tracking-[0.2em] mb-10"
        >
          Intégrations natives avec vos outils préférés
        </motion.p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#020c05] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#020c05] to-transparent z-10" />
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 w-max"
          >
            {[...logos, ...logos].map((logo, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-xl border border-emerald-900/30 bg-emerald-950/20 whitespace-nowrap">
                <span className="text-emerald-700 text-lg">{logo.symbol}</span>
                <span className="text-white/40 text-sm font-medium">{logo.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
