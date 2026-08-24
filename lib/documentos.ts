import type { Estado } from "@/components/ui/EstadoBadge";
import type { TipoDocumento } from "@/types/database.types";

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: "permiso_circulacion", label: "Permiso de circulación" },
  { value: "revision_tecnica", label: "Revisión técnica" },
  { value: "seguro", label: "Seguro" },
  { value: "otro", label: "Otro" },
];

const ETIQUETAS = Object.fromEntries(
  TIPOS_DOCUMENTO.map((t) => [t.value, t.label]),
) as Record<TipoDocumento, string>;

export function etiquetaTipoDocumento(tipo: TipoDocumento): string {
  return ETIQUETAS[tipo] ?? tipo;
}

export function esTipoDocumentoValido(valor: string): valor is TipoDocumento {
  return TIPOS_DOCUMENTO.some((t) => t.value === valor);
}

const UMBRAL_AVISO_DIAS = 30;

// Compara puramente por fecha (YYYY-MM-DD) en UTC para no depender de la
// zona horaria del servidor ni de la hora exacta de "ahora".
export function calcularEstadoDocumento(fechaVencimiento: string): Estado {
  const hoy = new Date().toISOString().slice(0, 10);
  const diasRestantes = diferenciaEnDias(fechaVencimiento, hoy);

  if (diasRestantes < 0) return "vencido";
  if (diasRestantes <= UMBRAL_AVISO_DIAS) return "por_vencer";
  return "al_dia";
}

function diferenciaEnDias(fechaA: string, fechaB: string): number {
  const msPorDia = 1000 * 60 * 60 * 24;
  const a = Date.parse(`${fechaA}T00:00:00Z`);
  const b = Date.parse(`${fechaB}T00:00:00Z`);
  return Math.round((a - b) / msPorDia);
}
