import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireAdminPage } from "@/lib/supabase/admin-context";
import { EstadoBadge, PRIORIDAD_ESTADO, type Estado } from "@/components/ui/EstadoBadge";
import { calcularEstadoMantencion } from "@/lib/mantencion";
import { calcularEstadoDocumento, etiquetaTipoDocumento } from "@/lib/documentos";
import type { TipoDocumento } from "@/types/database.types";

interface VehiculoResumen {
  id: string;
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
  vehiculoLabel: string;
  detalle: string;
  estado: Estado;
}

export default async function AvisosFlotaPage({
  params,
}: PageProps<"/dashboard/[flotaId]/avisos">) {
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
    .select("id, patente, marca, km_actual, km_ultima_mantencion, intervalo_mantencion_km")
    .eq("flota_id", flota.id);

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
    <section className="space-y-3">
      <h2 className="text-lg font-medium text-text">Avisos</h2>

      {avisos.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm">
          <CheckCircle2 size={24} className="text-success" aria-hidden="true" />
          <p className="text-base text-text">
            Todo al día. No hay documentos ni mantenciones pendientes en esta flota.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {avisos.map((aviso) => (
            <li key={aviso.key}>
              <Link
                href={`/dashboard/flotas/${flota.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-row sm:items-center sm:justify-between"
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
  );
}

function etiquetaVehiculo(vehiculo: VehiculoResumen): string {
  return vehiculo.marca ? `${vehiculo.patente} — ${vehiculo.marca}` : vehiculo.patente;
}

// Misma lógica que antes vivía en /dashboard (ahora agregada por flota en vez
// de por toda la empresa): reusa calcularEstadoDocumento/calcularEstadoMantencion,
// solo arma los strings de presentación.
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
