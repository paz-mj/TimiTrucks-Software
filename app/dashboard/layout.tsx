import { requireAdminPage } from "@/lib/supabase/admin-context";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { supabase, empresaId } = await requireAdminPage();

  const { data: flotas } = await supabase
    .from("flotas")
    .select("id, nombre")
    .eq("empresa_id", empresaId)
    .order("nombre");

  return <DashboardChrome flotas={flotas ?? []}>{children}</DashboardChrome>;
}
