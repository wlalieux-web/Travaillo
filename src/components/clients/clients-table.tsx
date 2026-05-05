"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, ArrowRight, UserCircle2, Building2, Home, ChevronDown } from "lucide-react";
import type { Client } from "@/lib/supabase/types";

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
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

export function ClientsTable({ clients, total }: { clients: Client[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function applyFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter("q", search);
  }

  const activeStatus = searchParams.get("status") ?? "";
  const activeType = searchParams.get("type") ?? "";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-500/40 transition-all"
          />
        </form>

        {/* Status filter */}
        <div className="flex gap-2">
          {["", "active", "prospect", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => applyFilter("status", s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                activeStatus === s
                  ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
              }`}
            >
              {s === "" ? "Tous" : STATUS_LABELS[s]}
            </button>
          ))}

          {/* Type filter */}
          <button
            onClick={() => applyFilter("type", activeType === "residential" ? "" : "residential")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              activeType === "residential"
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
            }`}
          >
            <Home className="h-3.5 w-3.5" /> Résidentiel
          </button>
          <button
            onClick={() => applyFilter("type", activeType === "commercial" ? "" : "commercial")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              activeType === "commercial"
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Commercial
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-white/30 text-sm">{total} client{total !== 1 ? "s" : ""}</p>

      {/* Table */}
      {clients.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
          <UserCircle2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-sm mb-4">
            {search ? `Aucun résultat pour "${search}"` : "Aucun client trouvé."}
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-600/30 transition-colors"
          >
            Ajouter un client
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {["Client", "Contact", "Ville", "Statut", "Depuis", ""].map((h, i) => (
                  <th key={i} className={`text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-wider ${i === 1 || i === 2 ? "hidden md:table-cell" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex items-center justify-center text-violet-300 text-sm font-bold flex-shrink-0">
                        {clientName(client).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{clientName(client)}</div>
                        <div className="flex items-center gap-1 text-white/30 text-xs">
                          {client.type === "residential"
                            ? <><Home className="h-3 w-3" /> Résidentiel</>
                            : <><Building2 className="h-3 w-3" /> Commercial</>
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-white/60 text-sm">{client.email || "—"}</div>
                    <div className="text-white/30 text-xs">{client.phone || ""}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/50 text-sm">{client.billing_city || "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[client.status]}`}>
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/30 text-xs">
                      {new Date(client.created_at).toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <ArrowRight className="h-4 w-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
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
