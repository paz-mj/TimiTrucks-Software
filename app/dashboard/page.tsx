import Link from "next/link";
import { CheckCircle2, Truck } from "lucide-react";
import { requireAdminPage } from "@/lib/supabase/admin-context";
import { AppHeader } from "@/components/AppHeader";
import { CrearFlotaForm } from "@/components/flotas/CrearFlotaForm";
import { EstadoBadge, type Estado } from "@/components/ui/EstadoBadge";
import { calcularEstadoMantencion } from "@/lib/mantencion";
import { calcularEstadoDocumento, etiquetaTipoDocumento } from "@/lib/documentos";
import type { TipoDocumento } from "@/types/database.types";

interface VehiculoResumen {
  id: string;
  flota_id: string;
  patente: string;
  marca: string | null;
  km_actual: number;
  km_ultima_mantencion: number;
  intervalo_mantencion_km: number;
}

interface DocumentoResumen {
  id: string;
  vehiculo_id: string;
  tipo: TipoDocumento;
  fecha_vencimiento: string;
}

interface Aviso {
  key: string;
  flotaId: string;
  vehiculoLabel: string;
  detalle: string;
  estado: Estado;
}

const PRIORIDAD_ESTADO: Record<Estado, number> = { vencido: 0, por_vencer: 1, al_dia: 2 };

export default async function DashboardPage() {
  const { supabase, empresaId, nombre } = await requireAdminPage();

  const { data: flotas } = await supabase
    .from("flotas")
    .select("id, nombre")
    .eq("empresa_id", empresaId)
    .order("nombre");

  const flotaIds = (flotas ?? []).map((f) => f.id);

  const { data: vehiculos } =
    flotaIds.length > 0
      ? await supabase
          .from("vehiculos")
          .select(
            "id, flota_id, patente, marca, km_actual, km_ultima_mantencion, intervalo_mantencion_km",
          )
          .in("flota_id", flotaIds)
      : { data: [] as VehiculoResumen[] };

  const vehiculoIds = (vehiculos ?? []).map((v) => v.id);

  const { data: documentos } =
    vehiculoIds.length > 0
      ? await supabase
          .from("documentos")
          .select("id, vehiculo_id, tipo, fecha_vencimiento")
          .in("vehiculo_id", vehiculoIds)
      : { data: [] as DocumentoResumen[] };

  const avisos = construirAvisos(vehiculos ?? [], documentos ?? []);

  return (
    <>
      <AppHeader titulo="Flota Tracker" />
      <main className="space-y-6 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-text">Hola, {nombre ?? "administrador"}</h2>

        <section className="space-y-3">
          <h3 className="text-lg font-medium text-text">Avisos</h3>

          {avisos.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-bg-card p-4">
              <CheckCircle2 size={24} className="text-success" aria-hidden="true" />
              <p className="text-base text-text">
                Todo al día. No hay documentos ni mantenciones pendientes.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {avisos.map((aviso) => (
                <li key={aviso.key}>
                  <Link
                    href={`/dashboard/flotas/${aviso.flotaId}`}
                    className="flex flex-col gap-2 rounded-lg border-2 border-border bg-bg-card p-4 hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-base font-medium text-text">{aviso.vehiculoLabel}</p>
                      <p className="text-sm text-text-secondary">{aviso.detalle}</p>
                    </div>
                    <EstadoBadge estado={aviso.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-medium text-text">Flotas</h3>

          {!flotas || flotas.length === 0 ? (
            <p className="text-base text-text-secondary">
              Todavía no tenés flotas creadas.
            </p>
          ) : (
            <ul className="space-y-2">
              {flotas.map((flota) => (
                <li key={flota.id}>
                  <Link
                    href={`/dashboard/flotas/${flota.id}`}
                    className="flex min-h-11 items-center gap-3 rounded-lg border-2 border-border bg-bg-card px-4 py-3 text-base font-medium text-text hover:border-border-strong"
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
      </main>
    </>
  );
}

function etiquetaVehiculo(vehiculo: VehiculoResumen): string {
  return vehiculo.marca ? `${vehiculo.patente} — ${vehiculo.marca}` : vehiculo.patente;
}

// Combina avisos de mantención y de documentos en una sola lista ordenada
// (vencidos primero). Solo arma strings de presentación a partir de datos ya
// obtenidos — el cálculo real de estado vive en las funciones puras de
// lib/mantencion.ts y lib/documentos.ts, no acá.
function construirAvisos(
  vehiculos: VehiculoResumen[],
  documentos: DocumentoResumen[],
): Aviso[] {
  const vehiculoPorId = new Map(vehiculos.map((v) => [v.id, v]));

  const avisosMantencion: Aviso[] = vehiculos
    .map((vehiculo) => ({ vehiculo, ...calcularEstadoMantencion(vehiculo) }))
    .filter((a) => a.estado !== "al_dia")
    .map((a) => ({
      key: `mantencion-${a.vehiculo.id}`,
      flotaId: a.vehiculo.flota_id,
      vehiculoLabel: etiquetaVehiculo(a.vehiculo),
      detalle:
        a.estado === "vencido"
          ? `Mantención atrasada por ${Math.abs(a.kmRestante).toLocaleString("es-CL")} km`
          : `Mantención en ${a.kmRestante.toLocaleString("es-CL")} km`,
      estado: a.estado,
    }));

  const avisosDocumentos: Aviso[] = documentos
    .map((documento) => ({
      documento,
      estado: calcularEstadoDocumento(documento.fecha_vencimiento),
    }))
    .filter((a) => a.estado !== "al_dia")
    .map((a) => {
      const vehiculo = vehiculoPorId.get(a.documento.vehiculo_id);
      const fecha = new Date(`${a.documento.fecha_vencimiento}T00:00:00`).toLocaleDateString(
        "es-CL",
        { dateStyle: "medium" },
      );

      return {
        key: `documento-${a.documento.id}`,
        flotaId: vehiculo?.flota_id ?? "",
        vehiculoLabel: vehiculo ? etiquetaVehiculo(vehiculo) : "Vehículo",
        detalle: `${etiquetaTipoDocumento(a.documento.tipo)} — ${
          a.estado === "vencido" ? "vencido el" : "vence el"
        } ${fecha}`,
        estado: a.estado,
      };
    });

  return [...avisosMantencion, ...avisosDocumentos].sort(
    (a, b) => PRIORIDAD_ESTADO[a.estado] - PRIORIDAD_ESTADO[b.estado],
  );
}
