"use client";

import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { getDashboardContext } from "@/lib/dashboard-nav";

interface Flota {
  id: string;
  nombre: string;
}

interface TopBarProps {
  flotas: Flota[];
  onMenuClick: () => void;
}

const SECCION_LABELS: Record<string, string> = {
  "": "Dashboard",
  "/avisos": "Avisos",
  "/mantenciones": "Mantenciones y Repuestos",
};

export function TopBar({ flotas, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { flotaId, enFlotasCrud, seccionSufijo } = getDashboardContext(pathname);
  const flotaActiva = flotas.find((f) => f.id === flotaId) ?? null;

  const titulo = enFlotasCrud
    ? flotaId
      ? "Detalle de flota"
      : "Flotas"
    : (SECCION_LABELS[seccionSufijo] ?? "Dashboard");

  function handleCambioFlota(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoId = e.target.value;
    if (!nuevoId) return;
    router.push(`/dashboard/${nuevoId}${enFlotasCrud ? "" : seccionSufijo}`);
  }

  return (
    <header className="flex items-center gap-3 border-b border-border-subtle bg-bg-card px-4 py-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={24} aria-hidden="true" />
      </button>

      {flotas.length > 0 && (
        <select
          value={flotaActiva?.id ?? ""}
          onChange={handleCambioFlota}
          aria-label="Seleccionar flota"
          className="min-h-11 rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {!flotaActiva && (
            <option value="" disabled>
              Elegí una flota
            </option>
          )}
          {flotas.map((flota) => (
            <option key={flota.id} value={flota.id}>
              {flota.nombre}
            </option>
          ))}
        </select>
      )}

      <div className="min-w-0 flex-1 text-right sm:text-left">
        {flotaActiva && !enFlotasCrud ? (
          <p className="truncate text-sm text-text-secondary">
            {flotaActiva.nombre} <span aria-hidden="true">/</span>{" "}
            <span className="font-medium text-text">{titulo}</span>
          </p>
        ) : (
          <p className="truncate text-lg font-medium text-text">{titulo}</p>
        )}
      </div>
    </header>
  );
}
