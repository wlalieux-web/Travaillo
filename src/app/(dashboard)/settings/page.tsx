import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  company_id: string | null;
  companies: {
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
};

export type Member = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  color: string | null;
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("*, companies(*)")
    .eq("id", user?.id ?? "")
    .single() as { data: ProfileRow | null };

  let members: Member[] = [];
  if (profile?.company_id && ["owner", "admin"].includes(profile.role)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("profiles")
      .select("id, first_name, last_name, email, role, is_active, color")
      .eq("company_id", profile.company_id)
      .order("created_at") as { data: Member[] | null };
    members = data ?? [];
  }

  return (
    <div>
      <Topbar title="Paramètres" />
      <div className="p-6 max-w-3xl space-y-6">
        <SettingsForm
          profile={profile}
          company={profile?.companies ?? null}
          members={members}
        />
      </div>
    </div>
  );
}
