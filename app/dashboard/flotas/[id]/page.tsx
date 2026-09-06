import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/supabase/admin-context";
import { CrearVehiculoForm } from "@/components/flotas/CrearVehiculoForm";
import { VehiculoRow } from "@/components/flotas/VehiculoRow";
import type { TipoDocumento } from "@/types/database.types";

interface DocumentoResumen {
  id: string;
  vehiculo_id: string;
  tipo: TipoDocumento;
  fecha_vencimiento: string;
}

export default async function FlotaDetailPage({
  params,
}: PageProps<"/dashboard/flotas/[id]">) {
  const { id } = await params;
  const { supabase, empresaId } = await requireAdminPage();

  const { data: flota } = await supabase
    .from("flotas")
    .select("id, nombre")
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (!flota) {
    notFound();
  }

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      "id, patente, marca, modelo, anio, intervalo_mantencion_km, conductor_id, foto_url, observaciones",
    )
    .eq("flota_id", flota.id)
    .order("patente");

  // Conductores de la empresa que podrían asignarse: todos los que ya
  // tienen rol conductor, menos los que ya manejan otro vehículo (a un
  // conductor no le asignamos dos vehículos a la vez desde acá).
  const { data: conductores } = await supabase
    .from("profiles")
    .select("id, nombre")
    .eq("empresa_id", empresaId)
    .eq("rol", "conductor")
    .order("nombre");

  const { data: flotasEmpresa } = await supabase
    .from("flotas")
    .select("id")
    .eq("empresa_id", empresaId);

  const flotaIds = (flotasEmpresa ?? []).map((f) => f.id);

  const { data: vehiculosConConductor } =
    flotaIds.length > 0
      ? await supabase
          .from("vehiculos")
          .select("id, conductor_id")
          .in("flota_id", flotaIds)
          .not("conductor_id", "is", null)
      : { data: [] as { id: string; conductor_id: string | null }[] };

  const vehiculoAsignadoDe = new Map<string, string>();
  for (const v of vehiculosConConductor ?? []) {
    if (v.conductor_id) vehiculoAsignadoDe.set(v.conductor_id, v.id);
  }

  const vehiculoIds = (vehiculos ?? []).map((v) => v.id);

  const { data: documentos } =
    vehiculoIds.length > 0
      ? await supabase
          .from("documentos")
          .select("id, vehiculo_id, tipo, fecha_vencimiento")
          .in("vehiculo_id", vehiculoIds)
          .order("fecha_vencimiento")
      : { data: [] as DocumentoResumen[] };

  const documentosPorVehiculo = new Map<string, DocumentoResumen[]>();
  for (const documento of documentos ?? []) {
    const lista = documentosPorVehiculo.get(documento.vehiculo_id) ?? [];
    lista.push(documento);
    documentosPorVehiculo.set(documento.vehiculo_id, lista);
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-text">{flota.nombre}</h2>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-text">Vehículos</h2>

        {!vehiculos || vehiculos.length === 0 ? (
          <p className="text-base text-text-secondary">
            Esta flota todavía no tiene vehículos.
          </p>
        ) : (
          <ul className="space-y-3">
            {vehiculos.map((vehiculo) => {
              const conductoresDisponibles = (conductores ?? []).filter(
                (c) =>
                  !vehiculoAsignadoDe.has(c.id) ||
                  vehiculoAsignadoDe.get(c.id) === vehiculo.id,
              );

              return (
                <VehiculoRow
                  key={vehiculo.id}
                  vehiculo={vehiculo}
                  conductoresDisponibles={conductoresDisponibles}
                  documentos={documentosPorVehiculo.get(vehiculo.id) ?? []}
                />
              );
            })}
          </ul>
        )}
      </section>

      <CrearVehiculoForm flotaId={flota.id} />
    </>
  );
}
