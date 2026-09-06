// Ojo: este archivo (plural, tabla `mantenciones`) es distinto de
// lib/mantencion.ts (singular), que calcula el estado del contador de km de
// un vehículo. Este archivo es sobre los registros del historial/log.
import type { TipoMantencion } from "@/types/database.types";

export const TIPOS_MANTENCION: { value: TipoMantencion; label: string }[] = [
  { value: "mantencion", label: "Mantención" },
  { value: "repuesto", label: "Repuesto" },
];

const ETIQUETAS = Object.fromEntries(
  TIPOS_MANTENCION.map((t) => [t.value, t.label]),
) as Record<TipoMantencion, string>;

export function etiquetaTipoMantencion(tipo: TipoMantencion): string {
  return ETIQUETAS[tipo] ?? tipo;
}

export function esTipoMantencionValido(valor: string): valor is TipoMantencion {
  return TIPOS_MANTENCION.some((t) => t.value === valor);
}
