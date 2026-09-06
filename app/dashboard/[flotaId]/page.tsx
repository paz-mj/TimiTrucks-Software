import { notFound } from "next/navigation";
import { Truck, AlertTriangle, FileX2, Wrench } from "lucide-react";
import { requireAdminPage } from "@/lib/supabase/admin-context";
import { VehiculoCard } from "@/components/dashboard/VehiculoCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { peorEstado } from "@/components/ui/EstadoBadge";
import { calcularEstadoDocumento } from "@/lib/documentos";
import { calcularEstadoMantencion } from "@/lib/mantencion";

export default async function DashboardFlotaPage({
  params,
}: PageProps<"/dashboard/[flotaId]">) {
  const { flotaId } = await params;
  const { supabase, empresaId } = await requireAdminPage();

  const { data: flota } = await supabase
    .from("flotas")
    .select("id, nombre")
    .eq("id", flotaId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (!flota) notFound();

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      "id, patente, marca, modelo, km_actual, km_ultima_mantencion, intervalo_mantencion_km, conductor_id, foto_url",
    )
    .eq("flota_id", flota.id)
    .order("patente");

  const vehiculoIds = (vehiculos ?? []).map((v) => v.id);

  const { data: documentos } =
    vehiculoIds.length > 0
      ? await supabase
          .from("documentos")
          .select("vehiculo_id, fecha_vencimiento")
          .in("vehiculo_id", vehiculoIds)
      : { data: [] as { vehiculo_id: string; fecha_vencimiento: string }[] };

  const conductorIds = (vehiculos ?? [])
    .map((v) => v.conductor_id)
    .filter((id): id is string => !!id);

  const { data: conductores } =
    conductorIds.length > 0
      ? await supabase.from("profiles").select("id, nombre").in("id", conductorIds)
      : { data: [] as { id: string; nombre: string | null }[] };

  const nombrePorConductor = new Map((conductores ?? []).map((c) => [c.id, c.nombre]));

  const docsPorVehiculo = new Map<string, string[]>();
  for (const doc of documentos ?? []) {
    const lista = docsPorVehiculo.get(doc.vehiculo_id) ?? [];
    lista.push(doc.fecha_vencimiento);
    docsPorVehiculo.set(doc.vehiculo_id, lista);
  }

  const vehiculosConEstado = (vehiculos ?? []).map((vehiculo) => {
    const fechasDocs = docsPorVehiculo.get(vehiculo.id) ?? [];
    const estadoDocs = fechasDocs.map(calcularEstadoDocumento);
    const estadoMantencion = calcularEstadoMantencion(vehiculo).estado;
    return { vehiculo, estado: peorEstado([...estadoDocs, estadoMantencion]) };
  });

  const conAviso = vehiculosConEstado.filter((v) => v.estado !== "al_dia").length;
  const documentosVencidos = (documentos ?? []).filter(
    (d) => calcularEstadoDocumento(d.fecha_vencimiento) === "vencido",
  ).length;
  const mantencionesProximas = vehiculosConEstado.filter(
    (v) => calcularEstadoMantencion(v.vehiculo).estado !== "al_dia",
  ).length;

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Truck} label="Vehículos" value={vehiculosConEstado.length} />
        <StatCard icon={AlertTriangle} label="Con aviso pendiente" value={conAviso} />
        <StatCard icon={FileX2} label="Documentos vencidos" value={documentosVencidos} />
        <StatCard icon={Wrench} label="Mantenciones próximas" value={mantencionesProximas} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-text">Vehículos</h2>

        {vehiculosConEstado.length === 0 ? (
          <p className="text-base text-text-secondary">
            Esta flota todavía no tiene vehículos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehiculosConEstado.map(({ vehiculo, estado }) => (
              <VehiculoCard
                key={vehiculo.id}
                vehiculo={vehiculo}
                estado={estado}
                conductorNombre={
                  vehiculo.conductor_id ? (nombrePorConductor.get(vehiculo.conductor_id) ?? null) : null
                }
                href={`/dashboard/flotas/${flota.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
