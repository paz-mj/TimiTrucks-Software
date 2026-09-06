import Link from "next/link";
import { Gauge, User } from "lucide-react";
import { FotoVehiculo } from "@/components/flotas/FotoVehiculo";
import { EstadoBadge, type Estado } from "@/components/ui/EstadoBadge";

interface VehiculoCardProps {
  vehiculo: {
    id: string;
    patente: string;
    marca: string | null;
    modelo: string | null;
    km_actual: number;
    foto_url: string | null;
  };
  estado: Estado;
  conductorNombre: string | null;
  href: string;
}

export function VehiculoCard({ vehiculo, estado, conductorNombre, href }: VehiculoCardProps) {
  const detalle = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ");

  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <FotoVehiculo fotoUrl={vehiculo.foto_url} patente={vehiculo.patente} className="h-16 w-16" />
        <EstadoBadge estado={estado} />
      </div>

      <div>
        <p className="text-lg font-semibold text-text">{vehiculo.patente}</p>
        <p className="text-sm text-text-secondary">{detalle || "Sin datos de marca/modelo"}</p>
      </div>

      <div className="flex items-center justify-between border-t-2 border-border pt-3 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Gauge size={16} aria-hidden="true" />
          {vehiculo.km_actual.toLocaleString("es-CL")} km
        </span>
        {conductorNombre && (
          <span className="flex min-w-0 items-center gap-1.5">
            <User size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{conductorNombre}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
