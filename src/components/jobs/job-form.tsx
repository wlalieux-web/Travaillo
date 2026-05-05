"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Save, AlertCircle, CalendarDays, RefreshCw, Clock, DollarSign } from "lucide-react";
import { AssignTechnicians } from "@/components/jobs/assign-technicians";
import { RruleBuilder } from "@/components/jobs/rrule-builder";
import { createJob } from "@/lib/jobs/actions";
import { toast } from "sonner";

interface Client { id: string; first_name: string | null; last_name: string | null; company_name: string | null }
interface Property { id: string; client_id: string; address: string; city: string | null; name: string | null }
interface Technician { id: string; first_name: string | null; last_name: string | null; color: string; avatar_url: string | null }

interface Props {
  clients: Client[];
  properties: Property[];
  technicians: Technician[];
  defaultClientId?: string;
}

const inputCls = "w-full bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/40 transition-all";
const labelCls = "text-white/50 text-xs font-medium uppercase tracking-wide block mb-1.5";

function clientLabel(c: Client) {
  if (c.company_name) return c.company_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

export function JobForm({ clients, properties, technicians, defaultClientId }: Props) {
  const router = useRouter();

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"one_off" | "recurring">("one_off");
  const [rrule, setRrule] = useState("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO");
  const [recurrenceStart, setRecurrenceStart] = useState("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [clientInstructions, setClientInstructions] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  // Première visite
  const [visitStart, setVisitStart] = useState(() => {
    const d = new Date(); d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [visitEnd, setVisitEnd] = useState(() => {
    const d = new Date(); d.setHours(11, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clientProperties = properties.filter((p) => p.client_id === clientId);

  function handleAssign(ids: string[], primary: string | null) {
    setAssigneeIds(ids);
    setPrimaryId(primary);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError("Sélectionnez un client."); return; }
    if (!title) { setError("Le titre est requis."); return; }

    setSaving(true);
    setError("");

    const res = await createJob({
      client_id: clientId,
      property_id: propertyId || null,
      title,
      description: description || undefined,
      type,
      recurrence_rule: type === "recurring" ? rrule : null,
      recurrence_start: type === "recurring" ? (recurrenceStart || visitStart.slice(0, 10)) : null,
      recurrence_end: type === "recurring" && recurrenceEnd ? recurrenceEnd : null,
      estimated_duration_minutes: estimatedDuration ? parseInt(estimatedDuration) : null,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      total: estimatedCost ? parseFloat(estimatedCost) : 0,
      currency: "CAD",
      client_instructions: clientInstructions || undefined,
      internal_notes: internalNotes || undefined,
      first_visit: {
        scheduled_start: new Date(visitStart).toISOString(),
        scheduled_end: new Date(visitEnd).toISOString(),
        assignee_ids: assigneeIds,
        primary_assignee_id: primaryId,
      },
    });

    setSaving(false);
    if (!res.ok) { setError(res.error); return; }

    toast.success("Job créé avec succès !");
    router.push(`/jobs/${res.data.jobId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* ── Colonne principale ── */}
      <div className="xl:col-span-2 space-y-5">

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Infos générales */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Informations générales</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Client *</label>
              <select value={clientId} onChange={(e) => { setClientId(e.target.value); setPropertyId(""); }} className={inputCls + " appearance-none"}>
                <option value="" className="bg-[#0d1f10]">— Sélectionner un client —</option>
                {clients.map((c) => <option key={c.id} value={c.id} className="bg-[#0d1f10]">{clientLabel(c)}</option>)}
              </select>
            </div>

            {clientProperties.length > 0 && (
              <div className="md:col-span-2">
                <label className={labelCls}>Propriété / Adresse de service</label>
                <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputCls + " appearance-none"}>
                  <option value="" className="bg-[#0d1f10]">— Adresse principale du client —</option>
                  {clientProperties.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0d1f10]">
                      {p.name ? `${p.name} — ` : ""}{p.address}{p.city ? `, ${p.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className={labelCls}>Titre du job *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Installation chauffe-eau" className={inputCls} required />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Détails des travaux..." className={inputCls + " resize-none"} />
            </div>

            <div>
              <label className={labelCls}>Durée estimée (minutes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input type="number" min={0} value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="120" className={inputCls + " pl-10"} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Coût estimé ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input type="number" min={0} step={0.01} value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="0.00" className={inputCls + " pl-10"} />
              </div>
            </div>
          </div>
        </div>

        {/* Type + récurrence */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Type de job</h3>

          <div className="flex gap-3">
            {[
              { value: "one_off", label: "Ponctuel", icon: CalendarDays },
              { value: "recurring", label: "Récurrent", icon: RefreshCw },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value as "one_off" | "recurring")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  type === t.value
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {type === "recurring" && (
            <div className="space-y-3">
              <RruleBuilder value={rrule} onChange={setRrule} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date de fin (optionnel)</label>
                  <input type="date" value={recurrenceEnd} onChange={(e) => setRecurrenceEnd(e.target.value)} className={inputCls} />
                  <p className="text-white/20 text-xs mt-1">Sans date de fin : 6 mois générés (max 200 visites)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Première visite */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">
            {type === "recurring" ? "Premier créneau" : "Créneau"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Début</label>
              <input type="datetime-local" value={visitStart} onChange={(e) => setVisitStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fin</label>
              <input type="datetime-local" value={visitEnd} onChange={(e) => setVisitEnd(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Techniciens assignés</label>
            <AssignTechnicians
              technicians={technicians}
              selected={assigneeIds}
              primaryId={primaryId}
              onChange={handleAssign}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Notes & instructions</h3>
          <div>
            <label className={labelCls}>Instructions pour le client</label>
            <textarea value={clientInstructions} onChange={(e) => setClientInstructions(e.target.value)} rows={2} placeholder="Informations à transmettre au client..." className={inputCls + " resize-none"} />
          </div>
          <div>
            <label className={labelCls}>Notes internes</label>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} placeholder="Notes pour votre équipe..." className={inputCls + " resize-none"} />
          </div>
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div className="space-y-4">
        <div className="bg-white/[0.02] border border-emerald-900/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-white/50 font-semibold text-sm uppercase tracking-wider">Résumé</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/40">
              <span>Type</span>
              <span className="text-white/70">{type === "one_off" ? "Ponctuel" : "Récurrent"}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Techniciens</span>
              <span className="text-white/70">{assigneeIds.length || "Aucun"}</span>
            </div>
            {estimatedDuration && (
              <div className="flex justify-between text-white/40">
                <span>Durée est.</span>
                <span className="text-white/70">{Math.floor(parseInt(estimatedDuration) / 60)}h{parseInt(estimatedDuration) % 60 > 0 ? `${parseInt(estimatedDuration) % 60}m` : ""}</span>
              </div>
            )}
            {estimatedCost && (
              <div className="flex justify-between text-white/40">
                <span>Coût est.</span>
                <span className="text-emerald-400 font-semibold">{parseFloat(estimatedCost).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</span>
              </div>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Création en cours..." : "Créer le job"}
        </motion.button>
      </div>
    </form>
  );
}
