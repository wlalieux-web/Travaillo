import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatWidget } from "@/components/chat/chat-widget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single() as { data: { company_id: string | null } | null };

  if (!profile?.company_id) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#050510] flex">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
