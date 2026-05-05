"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, User, Building2, Mail, Phone, MapPin, Home, Tag, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SOURCES = ["Référence", "Google", "Facebook", "Instagram", "Porte-à-porte", "Appel entrant", "Site web", "Autre"];

export function NewClientForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<"residential" | "commercial">("residential");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("QC");
  const [postalCode, setPostalCode] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "prospect">("active");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      setError("Aucune entreprise associée à votre compte.");
      setLoading(false);
      return;
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        company_id: profile.company_id,
        type,
        status,
        first_name: firstName || null,
        last_name: lastName || null,
        company_name: companyName || null,
        email: email || null,
        phone: phone || null,
        phone_alt: phoneAlt || null,
        billing_address: address || null,
        billing_city: city || null,
        billing_province: province || null,
        billing_postal_code: postalCode || null,
        source: source || null,
        notes: notes || null,
        tags: [],
      })
      .select()
      .single();

    if (clientError || !client) {
      setError("Erreur lors de la création du client.");
      setLoading(false);
      return;
    }

    // Créer la propriété principale si adresse fournie
    if (address) {
      await supabase.from("properties").insert({
        company_id: profile.company_id,
        client_id: client.id,
        name: "Adresse principale",
        address,
        city: city || null,
        province: province || null,
        postal_code: postalCode || null,
        is_primary: true,
      });
    }

    router.push(`/clients/${client.id}`);
  }

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all";
  const labelClass = "text-white/60 text-sm font-medium block mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>
      )}

      {/* Type */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-violet-400" /> Type de client
        </h3>
        <div className="flex gap-3">
          {(["residential", "commercial"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                type === t
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20"
              }`}
            >
              {t === "residential" ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {t === "residential" ? "Résidentiel" : "Commercial"}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            {(["active", "prospect"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  status === s
                    ? s === "active"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "bg-white/[0.03] border-white/[0.08] text-white/40"
                }`}
              >
                {s === "active" ? "Actif" : "Prospect"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Identité */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-violet-400" /> Identité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {type === "commercial" && (
            <div className="md:col-span-2">
              <label className={labelClass}>Nom de l'entreprise</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp." className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>Prénom {type === "commercial" && <span className="text-white/20">(contact)</span>}</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nom</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-violet-400" /> Coordonnées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@exemple.com" className={inputClass + " pl-10"} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Téléphone principal</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(514) 000-0000" className={inputClass + " pl-10"} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Téléphone alternatif</label>
            <input type="tel" value={phoneAlt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder="(514) 000-0001" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-violet-400" /> Adresse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Rue</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 rue Principale" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ville</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Montréal" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Province</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass + " appearance-none"}>
                {["QC", "ON", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"].map((p) => (
                  <option key={p} value={p} className="bg-[#0a0a1a]">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Code postal</label>
              <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="H0H 0H0" className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* Infos CRM */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-violet-400" /> Infos CRM
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass + " appearance-none"}>
              <option value="" className="bg-[#0a0a1a]">— Sélectionner —</option>
              {SOURCES.map((s) => <option key={s} value={s} className="bg-[#0a0a1a]">{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Notes internes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-white/20" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Infos importantes sur ce client..."
                rows={3}
                className={inputClass + " pl-10 resize-none"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] transition-colors"
        >
          Annuler
        </button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Création..." : "Créer le client"}
        </motion.button>
      </div>
    </form>
  );
}
