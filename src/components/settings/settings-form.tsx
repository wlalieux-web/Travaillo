"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, Check, Loader2, Building2, User,
  Mail, Phone, MapPin, TreePine, ImageIcon,
  Copy, RefreshCw, Users, Shield, Wrench, Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Member } from "@/app/(dashboard)/settings/page";

interface Props {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    company_id: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    logo_url: string | null;
    invite_code: string | null;
    plan: string;
  } | null;
  members: Member[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner:      { label: "Propriétaire", icon: Shield,   color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  admin:      { label: "Admin",        icon: Shield,   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  technician: { label: "Technicien",   icon: Wrench,   color: "text-white/60 bg-white/[0.05] border-white/10" },
  office:     { label: "Bureau",       icon: Briefcase, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
};

export function SettingsForm({ profile, company, members }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.role === "owner" || profile?.role === "admin";

  // Company fields
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [companyEmail, setCompanyEmail] = useState(company?.email ?? "");
  const [companyPhone, setCompanyPhone] = useState(company?.phone ?? "");
  const [companyAddress, setCompanyAddress] = useState(company?.address ?? "");
  const [companyCity, setCompanyCity] = useState(company?.city ?? "");

  // Profile fields
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [profilePhone, setProfilePhone] = useState(profile?.phone ?? "");

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(company?.logo_url ?? null);
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Save states
  const [companySave, setCompanySave] = useState<SaveState>("idle");
  const [profileSave, setProfileSave] = useState<SaveState>("idle");

  // Invite code
  const [inviteCode, setInviteCode] = useState(company?.invite_code ?? "");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  /* ── Invite code ─────────────────────────────────────────── */
  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerateCode() {
    if (!company?.id) return;
    setRegenerating(true);
    const newCode = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("companies")
      .update({ invite_code: newCode })
      .eq("id", company.id);

    if (!error) setInviteCode(newCode);
    setRegenerating(false);
  }

  /* ── Logo upload ─────────────────────────────────────────── */
  async function uploadLogo(file: File) {
    if (!company?.id) return;

    setUploading(true);
    setUploadError("");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${company.id}/logo.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setUploadError("Erreur lors de l'upload. Vérifiez le format (PNG, JPG, WebP, SVG).");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(path);

    const urlWithTs = `${publicUrl}?t=${Date.now()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("companies")
      .update({ logo_url: urlWithTs })
      .eq("id", company.id);

    setLogoUrl(urlWithTs);
    setLogoPreview(urlWithTs);
    setUploading(false);
    router.refresh();
  }

  function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Fichier trop lourd. Maximum 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    uploadLogo(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function removeLogo() {
    if (!company?.id) return;
    setLogoPreview(null);
    setLogoUrl(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("companies")
      .update({ logo_url: null })
      .eq("id", company.id);
    router.refresh();
  }

  /* ── Save company ────────────────────────────────────────── */
  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompanySave("saving");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("companies")
      .update({ name: companyName, email: companyEmail, phone: companyPhone, address: companyAddress, city: companyCity })
      .eq("id", company?.id ?? "");
    setCompanySave(error ? "error" : "saved");
    if (!error) setTimeout(() => setCompanySave("idle"), 3000);
    router.refresh();
  }

  /* ── Save profile ────────────────────────────────────────── */
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSave("saving");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName, phone: profilePhone })
      .eq("id", profile?.id ?? "");
    setProfileSave(error ? "error" : "saved");
    if (!error) setTimeout(() => setProfileSave("idle"), 3000);
    router.refresh();
  }

  const inputClass = "w-full bg-white/[0.04] border border-emerald-900/30 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all";
  const labelClass = "text-white/50 text-xs font-medium block mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-6">

      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-emerald-400" /> Logo de l'entreprise
        </h2>
        <p className="text-white/35 text-sm mb-6">PNG, JPG, WebP ou SVG · Max 2 MB · Recommandé: 256×256px</p>

        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-xl border border-emerald-900/30 bg-white/[0.03] flex items-center justify-center overflow-hidden relative group">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  <button
                    onClick={removeLogo}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </>
              ) : (
                <TreePine className="h-10 w-10 text-emerald-700/50" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragOver
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-emerald-900/30 hover:border-emerald-600/40 hover:bg-white/[0.02]"
            }`}
          >
            <Upload className={`h-7 w-7 mb-3 transition-colors ${dragOver ? "text-emerald-400" : "text-white/20"}`} />
            <p className="text-white/50 text-sm font-medium">
              {dragOver ? "Déposez votre logo ici" : "Glissez votre logo ou cliquez pour choisir"}
            </p>
            <p className="text-white/25 text-xs mt-1">PNG, JPG, WebP, SVG — max 2 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
            >
              {uploadError}
            </motion.div>
          )}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Upload en cours...
            </motion.div>
          )}
          {logoUrl && !uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
            >
              <Check className="h-4 w-4" /> Logo enregistré avec succès
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Company info ──────────────────────────────────── */}
      <form onSubmit={saveCompany} className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-400" /> Informations de l'entreprise
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Nom de l'entreprise</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="Logistique Boréal Inc." />
          </div>
          <div>
            <label className={labelClass}>Email professionnel</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className={inputClass + " pl-10"} placeholder="info@entreprise.com" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className={inputClass + " pl-10"} placeholder="(514) 000-0000" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className={inputClass + " pl-10"} placeholder="123 rue Principale" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Ville</label>
            <input type="text" value={companyCity} onChange={e => setCompanyCity(e.target.value)} className={inputClass} placeholder="Montréal" />
          </div>
        </div>

        <SaveButton state={companySave} />
      </form>

      {/* ── Profile ───────────────────────────────────────── */}
      <form onSubmit={saveProfile} className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-400" /> Mon profil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Prénom</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} placeholder="Jean" />
          </div>
          <div>
            <label className={labelClass}>Nom</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Dupont" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={profile?.email ?? ""} disabled className={inputClass + " opacity-40 cursor-not-allowed"} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className={inputClass + " pl-10"} placeholder="(514) 000-0000" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Rôle</label>
            <input type="text" value={ROLE_CONFIG[profile?.role ?? ""]?.label ?? profile?.role ?? ""} disabled className={inputClass + " opacity-40 cursor-not-allowed"} />
          </div>
        </div>

        <SaveButton state={profileSave} />
      </form>

      {/* ── Invite code (admin/owner only) ────────────────── */}
      {isAdmin && (
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" /> Code d'invitation
          </h2>
          <p className="text-white/35 text-sm mb-5">
            Partagez ce code avec vos employés pour qu'ils rejoignent votre équipe sur la page d'inscription.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/[0.04] border border-emerald-900/30 rounded-lg px-4 py-3 font-mono text-emerald-300 text-sm tracking-widest select-all overflow-x-auto">
              {inviteCode || "—"}
            </div>

            <button
              onClick={copyCode}
              title="Copier le code"
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                copied
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copié !" : "Copier"}
            </button>

            {profile?.role === "owner" && (
              <button
                onClick={regenerateCode}
                disabled={regenerating}
                title="Générer un nouveau code (invalide l'ancien)"
                className="flex-shrink-0 p-3 rounded-lg border border-white/10 bg-white/[0.04] text-white/40 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all disabled:opacity-40"
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          <p className="text-white/20 text-xs mt-3">
            {profile?.role === "owner"
              ? "Seul le propriétaire peut régénérer le code. L'ancien code devient invalide immédiatement."
              : "Contactez le propriétaire pour régénérer le code."}
          </p>
        </div>
      )}

      {/* ── Team members (admin/owner only) ───────────────── */}
      {isAdmin && members.length > 0 && (
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" /> Mon équipe
            <span className="ml-auto text-white/30 text-xs font-normal">{members.length} membre{members.length > 1 ? "s" : ""}</span>
          </h2>

          <div className="space-y-2">
            {members.map((m) => {
              const roleConf = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.technician;
              const RoleIcon = roleConf.icon;
              const initials = [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

              return (
                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] ${!m.is_active ? "opacity-40" : ""}`}>
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: m.color ?? "#6366f1" }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") || "Sans nom"}
                      {m.id === profile?.id && <span className="ml-2 text-white/30 text-xs">(vous)</span>}
                    </div>
                    <div className="text-white/30 text-xs truncate">{m.email ?? "—"}</div>
                  </div>

                  {/* Role badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium flex-shrink-0 ${roleConf.color}`}>
                    <RoleIcon className="h-3 w-3" />
                    {roleConf.label}
                  </div>

                  {/* Inactive badge */}
                  {!m.is_active && (
                    <span className="text-white/30 text-xs border border-white/10 rounded-full px-2 py-0.5 flex-shrink-0">
                      Inactif
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SaveButton({ state }: { state: SaveState }) {
  return (
    <motion.button
      whileHover={{ scale: state === "saving" ? 1 : 1.01 }}
      whileTap={{ scale: 0.99 }}
      type="submit"
      disabled={state === "saving"}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        state === "saved"
          ? "bg-emerald-600/30 border border-emerald-500/40 text-emerald-300"
          : state === "error"
          ? "bg-rose-600/20 border border-rose-500/30 text-rose-400"
          : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
      {state === "saved" && <Check className="h-4 w-4" />}
      {state === "idle" && "Enregistrer"}
      {state === "saving" && "Enregistrement..."}
      {state === "saved" && "Enregistré !"}
      {state === "error" && "Erreur — réessayer"}
    </motion.button>
  );
}
