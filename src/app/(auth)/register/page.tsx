"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Mail, Lock, User, Loader2, Users, Plus, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "choose" | "create" | "join" | "email-sent";

const PLAN_LABELS: Record<string, { label: string; seats: number }> = {
  free:       { label: "Gratuit",    seats: 1    },
  starter:    { label: "Starter",    seats: 5    },
  pro:        { label: "Croissance", seats: 25   },
  enterprise: { label: "Entreprise", seats: 9999 },
};

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("choose");
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // ── Créer une équipe ─────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (authData.session) {
      router.push("/onboarding");
    } else {
      setMode("email-sent");
      setLoading(false);
    }
  }

  // ── Rejoindre une équipe ─────────────────────────────────
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    // 1 + 2. Valider le code via API route (service role, bypass RLS)
    const res = await fetch("/api/invite/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim() }),
    });
    const result = await res.json() as {
      valid: boolean; id: string; name: string; plan: string;
      can_add: boolean; seats: number; error?: string;
    };

    if (!result.valid) {
      setError("Code d'invitation invalide. Vérifiez le code et réessayez.");
      setLoading(false); return;
    }

    if (!result.can_add) {
      const planInfo = PLAN_LABELS[result.plan];
      setError(`L'équipe "${result.name}" a atteint sa limite de ${result.seats} membres (plan ${planInfo?.label ?? result.plan}).`);
      setLoading(false); return;
    }

    // 3. Créer le compte — company_id dans les métadonnées
    //    Le trigger handle_new_user lie automatiquement le profil à la company
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_id: result.id,
          role: "technician",
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message ?? "Erreur lors de la création du compte.");
      setLoading(false); return;
    }

    if (authData.session && authData.user) {
      // Email confirmation désactivé — session immédiate.
      // Mise à jour directe en plus du trigger (sécurité supplémentaire).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("profiles").update({
        company_id: result.id,
        role: "technician",
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: true,
      }).eq("id", authData.user.id);

      router.push("/dashboard");
    } else {
      // Email confirmation activé — le trigger a déjà lié le profil via les métadonnées
      setMode("email-sent");
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all";

  return (
    <div className="min-h-screen bg-[#020c05] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/[0.06] via-transparent to-cyan-600/[0.06]" />
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <TreePine className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">
            Logistique<span className="text-emerald-400"> Boréal</span>
          </span>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Choix initial ── */}
          {mode === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm"
            >
              <h1 className="text-2xl font-bold text-white mb-1">Créer un compte</h1>
              <p className="text-white/40 text-sm mb-8">
                Déjà un compte ?{" "}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Se connecter</Link>
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setMode("create")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Plus className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">Créer une équipe</div>
                    <div className="text-white/40 text-xs mt-0.5">Vous devenez administrateur · Invitez vos employés</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                </button>

                <button
                  onClick={() => setMode("join")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="h-5 w-5 text-white/50" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">Rejoindre une équipe</div>
                    <div className="text-white/40 text-xs mt-0.5">Entrez le code d'invitation de votre employeur</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                </button>
              </div>

              <p className="text-white/20 text-xs text-center">
                En créant un compte vous acceptez nos <span className="text-white/40">CGU</span>
              </p>
            </motion.div>
          )}

          {/* ── Créer une équipe ── */}
          {mode === "create" && (
            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm"
            >
              <button onClick={() => setMode("choose")} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Créer une équipe</h1>
              </div>
              <p className="text-white/40 text-sm mb-6">Vous serez administrateur et pourrez inviter vos employés.</p>

              {error && <div className="mb-4 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs font-medium block mb-1.5">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" required className={inputCls + " pl-9"} />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-medium block mb-1.5">Nom</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required className={inputCls + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 caractères" required minLength={8} className={inputCls + " pl-10"} />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Création..." : "Créer mon équipe →"}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ── Rejoindre une équipe ── */}
          {mode === "join" && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm"
            >
              <button onClick={() => setMode("choose")} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-white/50" />
                </div>
                <h1 className="text-xl font-bold text-white">Rejoindre une équipe</h1>
              </div>
              <p className="text-white/40 text-sm mb-6">Demandez le code d'invitation à votre administrateur.</p>

              {error && <div className="mb-4 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1.5">Code d'invitation</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder="ex : 6574d108..."
                    required
                    className={inputCls + " font-mono tracking-wider text-center text-base"}
                    maxLength={64}
                    autoFocus
                  />
                  <p className="text-white/25 text-xs mt-1.5 text-center">Fourni par votre administrateur</p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs font-medium block mb-1.5">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" required className={inputCls + " pl-9"} />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-medium block mb-1.5">Nom</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required className={inputCls + " pl-10"} />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 caractères" required minLength={8} className={inputCls + " pl-10"} />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Vérification du code..." : "Rejoindre l'équipe →"}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ── Confirmation email envoyé ── */}
          {mode === "email-sent" && (
            <motion.div key="email-sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5"
              >
                <MailCheck className="h-8 w-8 text-emerald-400" />
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-2">Vérifiez vos emails</h2>
              <p className="text-white/40 text-sm mb-1">
                Un lien de confirmation a été envoyé à
              </p>
              <p className="text-emerald-400 font-medium text-sm mb-6">{email}</p>
              <p className="text-white/25 text-xs">
                Cliquez sur le lien dans l'email pour activer votre compte.
                <br />Pensez à vérifier vos spams.
              </p>

              <button
                onClick={() => setMode("choose")}
                className="mt-8 text-white/30 hover:text-white/60 text-sm transition-colors"
              >
                ← Retour à l'accueil
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
