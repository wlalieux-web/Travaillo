"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Building2, Phone, MapPin, Wrench, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SERVICE_TYPES = [
  { id: "plumbing", label: "Plomberie", emoji: "🔧" },
  { id: "electrical", label: "Électricité", emoji: "⚡" },
  { id: "hvac", label: "Climatisation / Chauffage", emoji: "❄️" },
  { id: "cleaning", label: "Nettoyage", emoji: "🧹" },
  { id: "landscaping", label: "Paysagisme", emoji: "🌿" },
  { id: "painting", label: "Peinture", emoji: "🎨" },
  { id: "roofing", label: "Toiture", emoji: "🏠" },
  { id: "other", label: "Autre", emoji: "🔨" },
];

const steps = ["Votre entreprise", "Type de service", "C'est parti !"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 1. Créer la company
    const { data: company, error: companyError } = await db
      .from("companies")
      .insert({ name: companyName, phone, city })
      .select()
      .single();

    if (companyError || !company) {
      setError("Erreur lors de la création de l'entreprise.");
      setLoading(false);
      return;
    }

    // 2. Lier le profil à la company
    const { error: profileError } = await db
      .from("profiles")
      .update({ company_id: company.id, role: "owner", onboarding_completed: true })
      .eq("id", user.id);

    if (profileError) {
      setError("Erreur lors de la configuration du profil.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#020c05] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/[0.06] via-transparent to-cyan-600/[0.06]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-white font-bold text-xl">
            Logistique<span className="text-emerald-400"> Boréal</span>
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                    ? "bg-emerald-600 text-white ring-2 ring-violet-400/30"
                    : "bg-white/[0.06] text-white/30"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 transition-all ${i < step ? "bg-emerald-500" : "bg-white/[0.08]"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-1">Votre entreprise</h2>
              <p className="text-white/40 text-sm mb-8">Ces infos apparaîtront sur vos devis et factures.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm font-medium block mb-1.5">Nom de l'entreprise *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Plomberie Dupont Inc."
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm font-medium block mb-1.5">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(514) 000-0000"
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm font-medium block mb-1.5">Ville principale</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Montréal"
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!companyName}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Continuer →
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-1">Type de services</h2>
              <p className="text-white/40 text-sm mb-6">Sélectionnez un ou plusieurs domaines.</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {SERVICE_TYPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedServices.includes(s.id)
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.1] transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Continuer →
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
              >
                <Wrench className="h-9 w-9 text-emerald-400" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">Tout est prêt !</h2>
              <p className="text-white/40 text-sm mb-2">
                <span className="text-emerald-400 font-semibold">{companyName}</span> est configurée.
              </p>
              <p className="text-white/30 text-sm mb-8">
                Votre essai gratuit de 14 jours commence maintenant.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? "Création en cours..." : "Accéder à mon tableau de bord →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
