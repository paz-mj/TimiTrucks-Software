import { Truck } from "lucide-react";

interface FotoVehiculoProps {
  fotoUrl: string | null;
  patente: string;
  className?: string;
}

// Nunca deja un espacio roto o vacío: si no hay foto, muestra un placeholder
// con el ícono Truck (misma convención de ícono que el resto de la app).
export function FotoVehiculo({ fotoUrl, patente, className = "" }: FotoVehiculoProps) {
  const base = `flex shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-border bg-bg ${className}`;

  if (!fotoUrl) {
    return (
      <div className={base}>
        <Truck size={24} className="text-text-secondary" aria-hidden="true" />
      </div>
    );
  }

  return (
    // Imagen externa servida desde Supabase Storage (bucket público): usar
    // next/image implicaría configurar remotePatterns y sumar cada carga a
    // la cuota de Image Optimization de Vercel. Una <img> simple no tiene
    // ese costo y alcanza para una foto de identificación.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fotoUrl}
      alt={`Foto del vehículo ${patente}`}
      className={`${base} object-cover`}
    />
  );
}
