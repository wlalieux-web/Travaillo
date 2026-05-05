"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, FileText, CalendarPlus, Receipt } from "lucide-react";

const actions = [
  { label: "Nouveau client", icon: UserPlus, href: "/clients/new", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", text: "text-emerald-300" },
  { label: "Nouveau devis", icon: FileText, href: "/quotes/new", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/20", text: "text-amber-300" },
  { label: "Planifier un job", icon: CalendarPlus, href: "/jobs/new", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", text: "text-emerald-300" },
  { label: "Créer une facture", icon: Receipt, href: "/invoices/new", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/20", text: "text-cyan-300" },
];

export function QuickActions() {
  return (
    <div>
      <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Actions rapides</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((a, i) => (
          <Link key={i} href={a.href}>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br ${a.color} border ${a.border} rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer`}
            >
              <a.icon className={`h-6 w-6 ${a.text}`} />
              <span className={`text-sm font-medium ${a.text}`}>{a.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
