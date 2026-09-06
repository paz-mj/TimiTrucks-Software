import Link from "next/link";
import { Truck } from "lucide-react";
import { requireAdminPage } from "@/lib/supabase/admin-context";
import { CrearFlotaForm } from "@/components/flotas/CrearFlotaForm";

export default async function FlotasPage() {
  const { supabase, empresaId } = await requireAdminPage();

  const { data: flotas } = await supabase
    .from("flotas")
    .select("id, nombre")
    .eq("empresa_id", empresaId)
    .order("nombre");

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-text">Flotas</h2>

        {!flotas || flotas.length === 0 ? (
          <p className="text-base text-text-secondary">Todavía no tenés flotas creadas.</p>
        ) : (
          <ul className="space-y-2">
            {flotas.map((flota) => (
              <li key={flota.id}>
                <Link
                  href={`/dashboard/flotas/${flota.id}`}
                  className="flex min-h-11 items-center gap-3 rounded-lg border border-border-subtle bg-bg-card px-4 py-3 text-base font-medium text-text shadow-sm hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Truck size={22} className="text-primary" aria-hidden="true" />
                  {flota.nombre}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CrearFlotaForm />
    </>
  );
}
