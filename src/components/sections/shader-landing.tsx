"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import {
  TreePine, ArrowRight, Menu, X, Check, Quote,
  BarChart3, CalendarDays, FileText, Users, Zap, Shield,
  ChevronDown, Star,
} from "lucide-react";
import Link from "next/link";

/* ─── NAV ─────────────────────────────────────────────────── */
const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Témoignages", href: "#testimonials" },
  { label: "Tarifs", href: "#pricing" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/70 backdrop-blur-2xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_16px_rgba(52,211,153,0.5)] group-hover:shadow-[0_0_24px_rgba(52,211,153,0.7)] transition-shadow">
            <TreePine className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">
            Logistique<span className="text-emerald-400"> Boréal</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-white/50 hover:text-white text-sm transition-colors px-3 py-1.5">
            Connexion
          </Link>
          <Link href="/register">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Essai gratuit <ArrowRight className="h-3.5 w-3.5" />
            </motion.span>
          </Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/60 hover:text-white transition-colors">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-2xl border-t border-white/10"
          >
            <div className="px-5 py-5 flex flex-col gap-4">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-sm">
                  {l.label}
                </a>
              ))}
              <Link href="/register" className="w-full py-3 rounded-lg bg-white text-black text-sm font-bold text-center">
                Essai gratuit
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ─── HERO ─────────────────────────────────────────────────── */
function Hero() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const y = useTransform(scrollY, [0, 500], [0, 80]);

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Full-screen shader */}
      <ShaderAnimation />

      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent_30%,black_100%)]" />

      {/* Content */}
      <motion.div style={{ opacity, y }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-8 text-sm text-white/70"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Plateforme CRM pour services terrain au Québec
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.9 }}
          className="text-6xl sm:text-7xl md:text-[96px] font-bold tracking-tight leading-[0.88] mb-8"
        >
          <span className="text-white">Gérez.</span>{" "}
          <span className="text-white">Planifiez.</span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
            Encaissez.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed mb-12"
        >
          De la demande client à la facture payée — Logistique Boréal automatise
          tout le cycle opérationnel de votre entreprise de services terrain.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register">
            <motion.span
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(52,211,153,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-[0_0_30px_rgba(52,211,153,0.35)] transition-shadow"
            >
              Démarrer gratuitement <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
          <a href="#how" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium text-base transition-all backdrop-blur-sm">
            Voir comment ça marche
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
            </div>
            <span>4.9/5 sur 600+ avis</span>
          </div>
          <span className="hidden sm:block">·</span>
          <span>+12 000 équipes actives</span>
          <span className="hidden sm:block">·</span>
          <span>14 jours gratuits, sans carte</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="flex flex-col items-center gap-1 text-white/20"
        >
          <span className="text-xs tracking-widest uppercase">Découvrir</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── LOGOS ─────────────────────────────────────────────────── */
const logoNames = ["Stripe", "QuickBooks", "Slack", "Google", "Mailchimp", "HubSpot", "Zapier", "Twilio"];

function LogoBand() {
  return (
    <section className="py-14 bg-black border-y border-white/[0.06] overflow-hidden">
      <p className="text-center text-white/25 text-xs uppercase tracking-[0.25em] mb-8">
        Intégrations natives avec vos outils
      </p>
      <div className="relative">
        <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 inset-y-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="flex gap-10 w-max"
        >
          {[...logoNames, ...logoNames].map((name, i) => (
            <div key={i} className="flex items-center gap-2.5 px-6 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
              <span className="text-white/35 text-sm font-medium">{name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ──────────────────────────────────────────── */
const steps = [
  { n: "01", title: "Un client appelle", desc: "Créez la fiche client en 30 secondes. Adresse, historique, propriétés — tout en un endroit.", icon: Users },
  { n: "02", title: "Envoyez un devis", desc: "Générez et envoyez un devis PDF professionnel par email ou SMS. Le client approuve en 1 clic.", icon: FileText },
  { n: "03", title: "Planifiez le job", desc: "Assignez le bon technicien, choisissez le créneau sur le calendrier. Rappel automatique au client.", icon: CalendarDays },
  { n: "04", title: "Facturez en sortant", desc: "Le technicien complète le job sur l'app mobile. La facture est générée et envoyée immédiatement.", icon: FileText },
];

function HowItWorks() {
  return (
    <section id="how" className="py-32 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(16,185,129,0.05),transparent)]" />
      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-emerald-400 text-xs uppercase tracking-[0.25em] font-semibold mb-4">Comment ça marche</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple comme une{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
              journée de travail
            </span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-lg">
            4 étapes. De la demande à l'encaissement. Sans friction.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(100%_-_12px)] w-full h-px bg-gradient-to-r from-emerald-700/40 to-transparent z-10" />
              )}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 h-full hover:border-emerald-700/40 hover:bg-emerald-950/10 transition-all duration-300">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-white/15 font-bold text-3xl tabular-nums">{step.n}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ──────────────────────────────────────────────── */
const features = [
  {
    icon: BarChart3,
    title: "Dashboard temps réel",
    desc: "KPIs, pipeline de ventes, revenus prévisionnels et activité d'équipe — tout en un coup d'œil.",
    tag: "Analytics",
    span: "md:col-span-2",
    accent: "emerald",
  },
  {
    icon: CalendarDays,
    title: "Calendrier & Dispatch",
    desc: "Glissez-déposez les jobs. Vue équipe, carte GPS, notifications push.",
    tag: "Planification",
    span: "md:col-span-1",
    accent: "teal",
  },
  {
    icon: FileText,
    title: "Devis & Factures PDF",
    desc: "Templates professionnels, envoi par email/SMS, paiement en ligne intégré via Stripe.",
    tag: "Facturation",
    span: "md:col-span-1",
    accent: "cyan",
  },
  {
    icon: Zap,
    title: "Automatisations",
    desc: "Rappels clients, relances devis, avis Google, rapports hebdomadaires — sans intervention manuelle.",
    tag: "No-code",
    span: "md:col-span-1",
    accent: "emerald",
  },
  {
    icon: Shield,
    title: "Sécurité & conformité",
    desc: "Hébergement Canada, chiffrement AES-256, RGPD, multi-utilisateurs avec permissions granulaires.",
    tag: "Entreprise",
    span: "md:col-span-2",
    accent: "teal",
  },
];

const accentMap: Record<string, { border: string; bg: string; text: string; tag: string }> = {
  emerald: { border: "border-emerald-700/30", bg: "hover:bg-emerald-950/20", text: "text-emerald-400", tag: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  teal: { border: "border-teal-700/30", bg: "hover:bg-teal-950/20", text: "text-teal-400", tag: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  cyan: { border: "border-cyan-700/30", bg: "hover:bg-cyan-950/20", text: "text-cyan-400", tag: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
};

function Features() {
  return (
    <section id="features" className="py-32 bg-black relative">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-emerald-400 text-xs uppercase tracking-[0.25em] font-semibold mb-4">Fonctionnalités</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Tout ce qu'il faut,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-300">rien de plus</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const a = accentMap[f.accent];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 0.98 }}
                className={`${f.span} group rounded-2xl border ${a.border} bg-white/[0.02] ${a.bg} p-7 transition-all duration-300 cursor-default`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-10 h-10 rounded-xl bg-white/[0.04] border ${a.border} flex items-center justify-center`}>
                    <f.icon className={`h-5 w-5 ${a.text}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${a.tag}`}>{f.tag}</span>
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ─────────────────────────────────────────────────── */
function Stats() {
  return (
    <section className="py-20 border-y border-white/[0.06] bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(16,185,129,0.04),transparent)]" />
      <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 lg:grid-cols-4 gap-10 text-center relative z-10">
        {[
          { value: "12 000+", label: "Équipes actives", sub: "au Canada" },
          { value: "98%", label: "Satisfaction", sub: "score NPS" },
          { value: "3×", label: "Plus de revenus", sub: "vs. sans logiciel" },
          { value: "40%", label: "Temps économisé", sub: "sur l'administratif" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-1">
              {s.value}
            </div>
            <div className="text-white/70 font-medium text-sm mb-0.5">{s.label}</div>
            <div className="text-white/25 text-xs">{s.sub}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ──────────────────────────────────────────── */
const testimonials = [
  {
    quote: "On a abandonné les feuilles Excel et les appels téléphoniques. Maintenant tout est dans Logistique Boréal. On a doublé notre chiffre d'affaires en 8 mois.",
    name: "Mathieu Tremblay",
    role: "Propriétaire, Plomberie Express MTL",
    stars: 5,
    avatar: "MT",
    color: "from-emerald-500 to-teal-600",
  },
  {
    quote: "Le dispatch sur la carte, c'est une révolution. On économise 2 heures par jour juste sur la coordination des techniciens.",
    name: "Isabelle Côté",
    role: "Directrice Opérations, NordClimat",
    stars: 5,
    avatar: "IC",
    color: "from-teal-500 to-cyan-600",
  },
  {
    quote: "Avant je relançais les clients manuellement. Maintenant les rappels partent tout seuls. J'ai récupéré 3 contrats oubliés le premier mois.",
    name: "Kevin Lapointe",
    role: "Fondateur, Paysagisme Boréal",
    stars: 5,
    avatar: "KL",
    color: "from-cyan-500 to-emerald-600",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-32 bg-black relative">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-emerald-400 text-xs uppercase tracking-[0.25em] font-semibold mb-4">Témoignages</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Ce qu'en disent{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">nos clients</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 flex flex-col gap-5 hover:border-emerald-700/30 transition-all"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <Quote className="h-5 w-5 text-white/15 -mb-2" />
              <p className="text-white/65 text-sm leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-white/35 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ───────────────────────────────────────────────── */
const plans = [
  {
    name: "Starter",
    price: "29",
    desc: "Pour démarrer et tester.",
    features: ["5 utilisateurs", "10 000 contacts", "Devis & factures", "Support email"],
    popular: false,
  },
  {
    name: "Croissance",
    price: "79",
    desc: "Pour les équipes en expansion.",
    features: ["25 utilisateurs", "Contacts illimités", "IA + Automatisations", "Omnicanal SMS/Email", "App mobile terrain", "Support prioritaire 24/7"],
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    desc: "Pour les grandes organisations.",
    features: ["Utilisateurs illimités", "SSO / SAML", "SLA dédié", "Onboarding personnalisé", "Account manager"],
    popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-32 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(16,185,129,0.05),transparent)]" />
      <div className="max-w-5xl mx-auto px-5 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-emerald-400 text-xs uppercase tracking-[0.25em] font-semibold mb-4">Tarifs</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Transparent.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Sans surprise.</span>
          </h2>
          <p className="text-white/40">Aucun frais d'activation. Annulation à tout moment.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl p-7 transition-all ${
                p.popular
                  ? "bg-white/[0.05] border border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.12)]"
                  : "bg-white/[0.02] border border-white/[0.07]"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    ⭐ Le plus populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{p.name}</h3>
                <p className="text-white/40 text-sm">{p.desc}</p>
              </div>

              <div className="mb-7">
                {p.price === "Sur devis" ? (
                  <span className="text-3xl font-bold text-white">Sur devis</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-white">{p.price}$</span>
                    <span className="text-white/35 mb-1.5 text-sm">/mois</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 ${p.popular ? "text-emerald-400" : "text-white/30"}`} />
                    <span className={p.popular ? "text-white/70" : "text-white/45"}>{f}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  p.popular
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                    : "bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.09]"
                }`}
              >
                {p.price === "Sur devis" ? "Nous contacter" : "Commencer"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ───────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="relative py-40 overflow-hidden bg-black">
      {/* Mini shader in background */}
      <div className="absolute inset-0 opacity-30">
        <ShaderAnimation />
      </div>
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_20%,black_80%)]" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Prêt à passer à{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              la vitesse supérieure ?
            </span>
          </h2>
          <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto">
            Rejoignez 12 000+ entreprises qui ont choisi Logistique Boréal. 14 jours gratuits, aucune carte requise.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(52,211,153,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(52,211,153,0.3)] transition-shadow"
              >
                Commencer gratuitement <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 px-10 py-5 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 font-medium text-lg transition-all backdrop-blur-sm">
              Voir une démo
            </a>
          </div>

          <p className="text-white/20 text-sm mt-8">
            14 jours d'essai · Aucun engagement · Migration gratuite incluse
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FOOTER ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.06] py-12">
      <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <TreePine className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-white font-bold">
            Logistique<span className="text-emerald-400"> Boréal</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm">
          {["Confidentialité", "Conditions", "Sécurité", "RGPD", "Statut"].map((item) => (
            <a key={item} href="#" className="hover:text-white/60 transition-colors">{item}</a>
          ))}
        </div>

        <p className="text-white/20 text-sm">© 2025 Logistique Boréal. Tous droits réservés.</p>
      </div>
    </footer>
  );
}

/* ─── ROOT ──────────────────────────────────────────────────── */
export function ShaderLanding() {
  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <Hero />
      <LogoBand />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
