import type { Estado } from "@/components/ui/EstadoBadge";

// Umbral de aviso: cuando quedan 1000km o menos para la mantención, pasa a
// "por_vencer" (regla de negocio definida en CLAUDE.md).
const UMBRAL_AVISO_KM = 1000;

interface VehiculoKm {
  km_actual: number;
  km_ultima_mantencion: number;
  intervalo_mantencion_km: number;
}

export function calcularEstadoMantencion(vehiculo: VehiculoKm): {
  estado: Estado;
  kmRestante: number;
} {
  const kmRecorridos = vehiculo.km_actual - vehiculo.km_ultima_mantencion;
  const kmRestante = vehiculo.intervalo_mantencion_km - kmRecorridos;

  let estado: Estado;
  if (kmRestante <= 0) {
    estado = "vencido";
  } else if (kmRestante <= UMBRAL_AVISO_KM) {
    estado = "por_vencer";
  } else {
    estado = "al_dia";
  }

  return { estado, kmRestante };
}
