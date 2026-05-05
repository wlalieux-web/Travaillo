import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { ClientDetail } from "@/components/clients/client-detail";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: properties }, { data: notes }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("properties").select("*").eq("client_id", id).order("is_primary", { ascending: false }),
    supabase.from("client_notes").select("*, profiles(first_name, last_name, avatar_url)").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  return (
    <div>
      <Topbar title="Fiche client" />
      <div className="p-6">
        <ClientDetail client={client} properties={properties ?? []} notes={notes ?? []} />
      </div>
    </div>
  );
}
