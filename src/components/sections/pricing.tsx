"use client";

import { motion } from "framer-motion";
import { Check, TreePine } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "29",
    description: "Pour les petites équipes qui débutent.",
    features: ["Jusqu'à 5 utilisateurs", "10 000 contacts", "Pipelines illimités", "Email marketing", "Support email 24/5"],
    cta: "Démarrer",
    popular: false,
  },
  {
    name: "Croissance",
    price: "79",
    description: "Pour les équipes en forte expansion.",
    features: ["Jusqu'à 25 utilisateurs", "100 000 contacts", "IA prédictive", "Automatisations avancées", "Omnicanal (Email, SMS, Chat)", "Support prioritaire 24/7"],
    cta: "Essayer 14 jours",
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    description: "Pour les grandes organisations.",
    features: ["Utilisateurs illimités", "Contacts illimités", "SSO / SAML", "Contrat SLA dédié", "Onboarding personnalisé", "Account manager dédié"],
    cta: "Contacter l'équipe",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-32 bg-[#020c05] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-emerald-400 text-sm uppercase tracking-[0.2em] font-semibold mb-4">Tarifs</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Simple et{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">transparent</span>
          </h2>
          <p className="text-white/40 text-lg">Aucun frais caché. Annulez à tout moment.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-b from-emerald-900/30 to-teal-900/15 border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.15)]"
                  : "bg-white/[0.02] border border-emerald-900/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    <TreePine className="h-3 w-3" /> Populaire
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-white/40 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.price === "Sur devis" ? (
                  <span className="text-3xl font-bold text-white">Sur devis</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-white">{plan.price}$</span>
                    <span className="text-white/40 mb-2">/mois</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? "bg-emerald-500/20" : "bg-white/[0.05]"}`}>
                      <Check className={`h-3 w-3 ${plan.popular ? "text-emerald-400" : "text-white/40"}`} />
                    </div>
                    <span className="text-white/60 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                    : "bg-white/[0.05] border border-emerald-900/30 text-white hover:bg-white/[0.08]"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
