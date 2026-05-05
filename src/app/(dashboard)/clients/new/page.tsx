import { Topbar } from "@/components/layout/topbar";
import { NewClientForm } from "@/components/clients/new-client-form";

export default function NewClientPage() {
  return (
    <div>
      <Topbar title="Nouveau client" />
      <div className="p-6 max-w-3xl">
        <NewClientForm />
      </div>
    </div>
  );
}
