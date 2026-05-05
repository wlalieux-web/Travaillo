"use client";

import { TreePine } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#020c05] border-t border-emerald-900/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TreePine className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-base">
              Logistique<span className="text-emerald-400"> Boréal</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm">
            {["Confidentialité", "CGU", "Sécurité", "RGPD", "Statut"].map((item) => (
              <a key={item} href="#" className="hover:text-white/60 transition-colors">{item}</a>
            ))}
          </div>

          <p className="text-white/20 text-sm">© 2025 Logistique Boréal. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
