"use client";

import { motion } from "framer-motion";
import { BarChart3, MessageSquare, Users, Zap, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BarChart3,
    title: "Analytics IA en temps réel",
    description: "Prédisez les comportements clients et anticipez les opportunités avant même qu'elles se présentent.",
    gradient: "from-emerald-500/[0.15]",
    hover: "from-emerald-500/[0.22]",
    iconColor: "text-emerald-400",
    span: "col-span-12 md:col-span-4",
  },
  {
    icon: MessageSquare,
    title: "Omnicanal unifié",
    description: "Email, SMS, WhatsApp, chat — tous vos canaux dans une seule interface fluide.",
    gradient: "from-teal-500/[0.15]",
    hover: "from-teal-500/[0.22]",
    iconColor: "text-teal-400",
    span: "col-span-12 md:col-span-8",
  },
  {
    icon: Users,
    title: "Collaboration d'équipe",
    description: "Assignez, commentez, notifiez. Votre équipe avance ensemble, même sur le terrain.",
    gradient: "from-cyan-500/[0.15]",
    hover: "from-cyan-500/[0.22]",
    iconColor: "text-cyan-400",
    span: "col-span-12 md:col-span-8",
  },
  {
    icon: Zap,
    title: "Automatisations No-Code",
    description: "Créez des workflows puissants en glisser-déposer. Zéro code requis.",
    gradient: "from-emerald-500/[0.15]",
    hover: "from-emerald-500/[0.22]",
    iconColor: "text-emerald-400",
    span: "col-span-12 md:col-span-4",
  },
  {
    icon: Globe,
    title: "Intégrations natives",
    description: "Connectez vos outils préférés en 1 clic. +200 intégrations disponibles.",
    gradient: "from-teal-500/[0.15]",
    hover: "from-teal-500/[0.22]",
    iconColor: "text-teal-400",
    span: "col-span-12 md:col-span-4",
  },
  {
    icon: Shield,
    title: "Sécurité entreprise",
    description: "Conformité RGPD, chiffrement AES-256, SSO, et audit logs complets.",
    gradient: "from-cyan-500/[0.15]",
    hover: "from-cyan-500/[0.22]",
    iconColor: "text-cyan-400",
    span: "col-span-12 md:col-span-8",
  },
];

function FeatureCard({ icon: Icon, title, description, gradient, hover, iconColor, span, index }: (typeof features)[0] & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ scale: 0.97, rotate: "-0.5deg" }}
      className={cn(
        "group relative min-h-[220px] cursor-pointer overflow-hidden rounded-2xl border border-emerald-900/30 bg-white/[0.02] p-7",
        "transition-colors duration-300 hover:bg-white/[0.05]",
        span
      )}
    >
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br", hover, "to-transparent")} />
      <div className={cn("absolute bottom-0 left-4 right-4 top-[55%] translate-y-10 rounded-t-xl bg-gradient-to-br", gradient, "to-transparent backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-3")} />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/[0.04] border border-emerald-900/30">
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-32 bg-[#020c05] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-emerald-400 text-sm uppercase tracking-[0.2em] font-semibold mb-4">Fonctionnalités</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Tout ce dont votre équipe{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              a besoin
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Une plateforme pensée pour les équipes de services terrain qui veulent aller vite sans sacrifier la qualité.
          </p>
        </motion.div>
        <div className="grid grid-cols-12 gap-4">
          {features.map((f, i) => <FeatureCard key={i} {...f} index={i} />)}
        </div>
      </div>
    </section>
  );
}
