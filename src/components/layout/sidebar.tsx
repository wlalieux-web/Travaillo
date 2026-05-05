"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, CalendarRange,
  Receipt, Settings, TreePine, ChevronRight, LogOut,
  BriefcaseBusiness, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/quotes", label: "Devis", icon: FileText },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/calendar", label: "Calendrier", icon: CalendarRange },
  { href: "/timesheet", label: "Pointage", icon: Clock },
  { href: "/invoices", label: "Factures", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Logistique Boréal");

  useEffect(() => {
    async function loadCompany() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("companies(name, logo_url)")
        .eq("id", user.id)
        .single();

      if (profile?.companies) {
        setLogoUrl(profile.companies.logo_url ?? null);
        setCompanyName(profile.companies.name ?? "Logistique Boréal");
      }
    }
    loadCompany();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-60 h-screen bg-[#030e06] border-r border-emerald-900/20 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-emerald-900/20">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          {/* Logo image ou fallback icône */}
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-emerald-900/30 bg-[#020c05] flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                <TreePine className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Nom tronqué si trop long */}
          <span className="text-white font-semibold text-sm leading-tight truncate">
            {companyName}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-emerald-400" : "text-white/30 group-hover:text-white/50")} />
                {item.label}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-emerald-400 ml-auto" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-emerald-900/20 space-y-0.5">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-all">
            <Settings className="h-4 w-4" /> Paramètres
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-rose-400 hover:bg-rose-500/[0.07] transition-all"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
