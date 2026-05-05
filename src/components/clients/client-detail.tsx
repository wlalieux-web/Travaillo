"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Phone, MapPin, Building2, Home, Tag, Edit2,
  FileText, CalendarDays, Receipt, Send, Loader2, MoreVertical,
} from "lucide-react";
import type { Client, Property, ClientNote } from "@/lib/supabase/types";
import { createClient as createSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-white/[0.05] text-white/40 border-white/[0.08]",
  prospect: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  archived: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Actif", inactive: "Inactif", prospect: "Prospect", archived: "Archivé",
};

function clientName(c: Client) {
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Client sans nom";
}

interface Props {
  client: Client;
  properties: Property[];
  notes: (ClientNote & { profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null })[];
}

export function ClientDetail({ client, properties, notes: initialNotes }: Props) {
  const supabase = createSupabase();
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  async function addNote() {
    if (!newNote.trim()) return;
    setSendingNote(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("client_notes")
      .insert({
        client_id: client.id,
        company_id: client.company_id,
        author_id: user?.id,
        content: newNote.trim(),
      })
      .select("*, profiles(first_name, last_name, avatar_url)")
      .single();

    if (data) setNotes([data as any, ...notes]);
    setNewNote("");
    setSendingNote(false);
  }

  const tabs = [
    { label: "Infos", icon: FileText },
    { label: "Propriétés", icon: Home },
    { label: "Jobs", icon: CalendarDays },
    { label: "Devis", icon: FileText },
    { label: "Factures", icon: Receipt },
  ];
  const [activeTab, setActiveTab] = useState("Infos");

  return (
    <div className="space-y-6">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex items-center justify-center text-violet-300 text-2xl font-bold flex-shrink-0">
              {clientName(client).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{clientName(client)}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[client.status]}`}>
                  {STATUS_LABELS[client.status]}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-white/40">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                    <Mail className="h-3.5 w-3.5" /> {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                    <Phone className="h-3.5 w-3.5" /> {client.phone}
                  </a>
                )}
                {client.billing_city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {client.billing_city}, {client.billing_province}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  {client.type === "residential" ? <Home className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                  {client.type === "residential" ? "Résidentiel" : "Commercial"}
                </span>
              </div>
              {client.source && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Tag className="h-3 w-3 text-white/20" />
                  <span className="text-white/30 text-xs">Source : {client.source}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/clients/${client.id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-sm hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" /> Modifier
            </button>
            <button className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-5 pt-5 border-t border-white/[0.06]">
          {[
            { label: "Nouveau devis", icon: FileText, color: "text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20" },
            { label: "Planifier un job", icon: CalendarDays, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20" },
            { label: "Créer facture", icon: Receipt, color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20" },
          ].map((a) => (
            <button key={a.label} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${a.color}`}>
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.label
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "Infos" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Prénom", value: client.first_name },
                  { label: "Nom", value: client.last_name },
                  { label: "Entreprise", value: client.company_name },
                  { label: "Email", value: client.email },
                  { label: "Téléphone", value: client.phone },
                  { label: "Tél. alternatif", value: client.phone_alt },
                  { label: "Adresse", value: client.billing_address },
                  { label: "Ville", value: client.billing_city },
                  { label: "Province", value: client.billing_province },
                  { label: "Code postal", value: client.billing_postal_code },
                  { label: "Solde", value: client.balance ? `${client.balance} $` : "0 $" },
                  { label: "Client depuis", value: new Date(client.created_at).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" }) },
                ].map(({ label, value }) => value && (
                  <div key={label}>
                    <div className="text-white/30 text-xs mb-0.5">{label}</div>
                    <div className="text-white/80 text-sm">{value}</div>
                  </div>
                ))}
              </div>
              {client.notes && (
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="text-white/30 text-xs mb-1.5">Notes</div>
                  <p className="text-white/60 text-sm whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "Propriétés" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {properties.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center text-white/30 text-sm">
                  Aucune propriété enregistrée.
                </div>
              ) : (
                properties.map((p) => (
                  <div key={p.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="h-4 w-4 text-violet-400" />
                      <span className="text-white font-medium text-sm">{p.name || "Propriété"}</span>
                      {p.is_primary && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20">Principale</span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm">{p.address}</p>
                    {(p.city || p.province) && (
                      <p className="text-white/30 text-xs">{[p.city, p.province, p.postal_code].filter(Boolean).join(", ")}</p>
                    )}
                    {p.notes && <p className="text-white/30 text-xs mt-2">{p.notes}</p>}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {(activeTab === "Jobs" || activeTab === "Devis" || activeTab === "Factures") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
              <p className="text-white/30 text-sm">Module {activeTab.toLowerCase()} — disponible prochainement.</p>
            </motion.div>
          )}
        </div>

        {/* Right: notes */}
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Notes internes</h3>

            {/* Add note */}
            <div className="mb-5">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note..."
                rows={3}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-500/40 transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/20 text-xs">⌘+Entrée pour envoyer</span>
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || sendingNote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/80 text-white text-xs font-medium disabled:opacity-40 hover:bg-violet-600 transition-colors"
                >
                  {sendingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Envoyer
                </button>
              </div>
            </div>

            {/* Notes list */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-4">Aucune note</p>
              ) : (
                notes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3"
                  >
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/25 text-xs">
                        {note.profiles
                          ? `${note.profiles.first_name ?? ""} ${note.profiles.last_name ?? ""}`.trim() || "Anonyme"
                          : "Anonyme"}
                      </span>
                      <span className="text-white/20 text-xs">
                        {new Date(note.created_at).toLocaleDateString("fr-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
