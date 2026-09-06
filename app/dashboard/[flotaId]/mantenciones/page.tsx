import { notFound } from "next/navigation";
import { Wrench, Package } from "lucide-react";
import { requireAdminPage } from "@/lib/supabase/admin-context";
import { MantencionForm } from "@/components/dashboard/MantencionForm";
import { EliminarMantencionButton } from "@/components/dashboard/EliminarMantencionButton";
import { etiquetaTipoMantencion } from "@/lib/mantenciones";

export default async function MantencionesFlotaPage({
  params,
}: PageProps<"/dashboard/[flotaId]/mantenciones">) {
  const { flotaId } = await params;
  const { supabase, empresaId } = await requireAdminPage();

  const { data: flota } = await supabase
    .from("flotas")
    .select("id")
    .eq("id", flotaId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (!flota) notFound();

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, patente, marca, modelo")
    .eq("flota_id", flota.id)
    .order("patente");

  const vehiculoIds = (vehiculos ?? []).map((v) => v.id);
  const patentePorVehiculo = new Map((vehiculos ?? []).map((v) => [v.id, v.patente]));

  const { data: registros } =
    vehiculoIds.length > 0
      ? await supabase
          .from("mantenciones")
          .select("id, vehiculo_id, tipo, descripcion, km, fecha")
          .in("vehiculo_id", vehiculoIds)
          .order("fecha", { ascending: false })
      : { data: [] as {
          id: string;
          vehiculo_id: string;
          tipo: "mantencion" | "repuesto";
          descripcion: string;
          km: number | null;
          fecha: string;
        }[] };

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-text">Mantenciones y repuestos</h2>

        {!registros || registros.length === 0 ? (
          <p className="text-base text-text-secondary">
            Todavía no hay registros de mantención ni repuestos en esta flota.
          </p>
        ) : (
          <ul className="space-y-2">
            {registros.map((registro) => {
              const Icon = registro.tipo === "mantencion" ? Wrench : Package;
              return (
                <li
                  key={registro.id}
                  className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className="mt-0.5 text-text-secondary" aria-hidden="true" />
                    <div>
                      <p className="text-base font-medium text-text">
                        {patentePorVehiculo.get(registro.vehiculo_id) ?? "Vehículo"} —{" "}
                        {etiquetaTipoMantencion(registro.tipo)}
                      </p>
                      <p className="text-sm text-text-secondary">{registro.descripcion}</p>
                      <p className="text-sm text-text-secondary">
                        {new Date(`${registro.fecha}T00:00:00`).toLocaleDateString("es-CL", {
                          dateStyle: "medium",
                        })}
                        {registro.km !== null &&
                          ` — ${registro.km.toLocaleString("es-CL")} km`}
                      </p>
                    </div>
                  </div>
                  <EliminarMantencionButton
                    mantencionId={registro.id}
                    descripcion={registro.descripcion}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <MantencionForm flotaId={flota.id} vehiculos={vehiculos ?? []} />
    </>
  );
}
