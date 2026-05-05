"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, UserCircle2 } from "lucide-react";
import type { Client } from "@/lib/supabase/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-white/[0.05] text-white/40 border-white/[0.08]",
  prospect: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  archived: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  prospect: "Prospect",
  archived: "Archivé",
};

function clientName(client: Client) {
  if (client.company_name) return client.company_name;
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client sans nom";
}

export function RecentClients({ clients }: { clients: Client[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold">Clients récents</h3>
        <Link href="/clients" className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition-colors">
          Voir tous <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <UserCircle2 className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Aucun client pour l'instant.</p>
          <Link href="/clients/new" className="inline-block mt-4 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors">
            Ajouter votre premier client →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold flex-shrink-0">
                        {clientName(client).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{clientName(client)}</div>
                        <div className="text-white/30 text-xs capitalize">
                          {client.type === "residential" ? "Résidentiel" : "Commercial"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="text-white/50 text-sm">{client.email || "—"}</div>
                    <div className="text-white/30 text-xs">{client.phone || ""}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[client.status]}`}>
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/clients/${client.id}`} className="opacity-0 group-hover:opacity-100 text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 justify-end transition-all">
                      Voir <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
