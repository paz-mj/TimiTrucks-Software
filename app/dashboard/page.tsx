import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/supabase/admin-context";

export default async function DashboardPage() {
  const { supabase, empresaId } = await requireAdminPage();

  const { data: flotas } = await supabase
    .from("flotas")
    .select("id")
    .eq("empresa_id", empresaId)
    .order("nombre")
    .limit(1);

  const primeraFlota = flotas?.[0];
  redirect(primeraFlota ? `/dashboard/${primeraFlota.id}` : "/dashboard/flotas");
}
