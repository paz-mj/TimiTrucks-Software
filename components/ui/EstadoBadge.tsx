import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export type Estado = "al_dia" | "por_vencer" | "vencido";

// Menor número = más urgente. Compartido por cualquier vista que necesite
// combinar varios estados en uno solo (grid, avisos agregados).
export const PRIORIDAD_ESTADO: Record<Estado, number> = { vencido: 0, por_vencer: 1, al_dia: 2 };

export function peorEstado(estados: Estado[]): Estado {
  return estados.reduce<Estado>(
    (peor, actual) => (PRIORIDAD_ESTADO[actual] < PRIORIDAD_ESTADO[peor] ? actual : peor),
    "al_dia",
  );
}

const config: Record<
  Estado,
  { label: string; icon: typeof CheckCircle2; text: string; bg: string }
> = {
  al_dia: {
    label: "Al día",
    icon: CheckCircle2,
    text: "text-success",
    bg: "bg-success-bg",
  },
  por_vencer: {
    label: "Por vencer",
    icon: AlertTriangle,
    text: "text-warning",
    bg: "bg-warning-bg",
  },
  vencido: {
    label: "Vencido",
    icon: XCircle,
    text: "text-danger-text",
    bg: "bg-danger-bg",
  },
};

interface EstadoBadgeProps {
  estado: Estado;
  label?: string;
}

// Nunca depende solo del color: siempre combina ícono + texto, para que sea
// legible también con dificultad para distinguir colores.
export function EstadoBadge({ estado, label }: EstadoBadgeProps) {
  const { label: defaultLabel, icon: Icon, text, bg } = config[estado];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full ${bg} ${text} px-3 py-1.5 text-sm font-medium`}
    >
      <Icon size={18} aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}
