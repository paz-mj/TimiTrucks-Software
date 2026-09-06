"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EditarVehiculoForm } from "@/components/flotas/EditarVehiculoForm";
import { EliminarVehiculoButton } from "@/components/flotas/EliminarVehiculoButton";
import { AsignarConductorForm } from "@/components/flotas/AsignarConductorForm";
import { DocumentosSection } from "@/components/flotas/DocumentosSection";
import { FotoVehiculo } from "@/components/flotas/FotoVehiculo";
import { SubirFotoVehiculoForm } from "@/components/flotas/SubirFotoVehiculoForm";
import { ObservacionesForm } from "@/components/flotas/ObservacionesForm";
import type { TipoDocumento } from "@/types/database.types";

interface Conductor {
  id: string;
  nombre: string | null;
}

interface Documento {
  id: string;
  tipo: TipoDocumento;
  fecha_vencimiento: string;
}

interface VehiculoRowProps {
  vehiculo: {
    id: string;
    patente: string;
    marca: string | null;
    modelo: string | null;
    anio: number | null;
    intervalo_mantencion_km: number;
    conductor_id: string | null;
    foto_url: string | null;
    observaciones: string | null;
  };
  conductoresDisponibles: Conductor[];
  documentos: Documento[];
}

export function VehiculoRow({ vehiculo, conductoresDisponibles, documentos }: VehiculoRowProps) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm sm:p-5">
        <EditarVehiculoForm
          vehiculo={vehiculo}
          onCancelar={() => setEditando(false)}
          onGuardado={() => setEditando(false)}
        />
      </li>
    );
  }

  const detalle = [vehiculo.marca, vehiculo.modelo, vehiculo.anio]
    .filter(Boolean)
    .join(" ");

  return (
    <li className="space-y-4 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FotoVehiculo
            fotoUrl={vehiculo.foto_url}
            patente={vehiculo.patente}
            className="h-14 w-14"
          />
          <div>
            <p className="text-lg font-semibold text-text">{vehiculo.patente}</p>
            <p className="text-base text-text-secondary">{detalle || "Sin datos de marca/modelo"}</p>
            <p className="text-sm text-text-secondary">
              Mantención cada {vehiculo.intervalo_mantencion_km.toLocaleString("es-CL")} km
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditando(true)}>
            <Pencil size={18} aria-hidden="true" />
            Editar
          </Button>
          <EliminarVehiculoButton vehiculoId={vehiculo.id} patente={vehiculo.patente} />
        </div>
      </div>

      <div className="border-t-2 border-border pt-4">
        <AsignarConductorForm
          vehiculoId={vehiculo.id}
          conductorActualId={vehiculo.conductor_id}
          conductoresDisponibles={conductoresDisponibles}
        />
      </div>

      <div className="border-t-2 border-border pt-4">
        <SubirFotoVehiculoForm
          vehiculoId={vehiculo.id}
          patente={vehiculo.patente}
          fotoUrl={vehiculo.foto_url}
        />
      </div>

      <div className="border-t-2 border-border pt-4">
        <ObservacionesForm vehiculoId={vehiculo.id} observaciones={vehiculo.observaciones} />
      </div>

      <DocumentosSection vehiculoId={vehiculo.id} documentos={documentos} />
    </li>
  );
}
