"use client";

import { useActionState, useEffect } from "react";
import { actualizarVehiculo, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { FormField } from "@/components/ui/FormField";

const initialState: ActionState = {};

interface VehiculoValores {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  intervalo_mantencion_km: number;
}

interface EditarVehiculoFormProps {
  vehiculo: VehiculoValores;
  onCancelar: () => void;
  onGuardado: () => void;
}

export function EditarVehiculoForm({
  vehiculo,
  onCancelar,
  onGuardado,
}: EditarVehiculoFormProps) {
  const actualizarConId = actualizarVehiculo.bind(null, vehiculo.id);
  const [state, formAction, isPending] = useActionState(actualizarConId, initialState);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      onGuardado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <h3 className="text-lg font-medium text-text">Editar vehículo</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Patente" name="patente" required defaultValue={vehiculo.patente} />
        <FormField label="Marca" name="marca" defaultValue={vehiculo.marca ?? ""} />
        <FormField label="Modelo" name="modelo" defaultValue={vehiculo.modelo ?? ""} />
        <FormField
          label="Año"
          name="anio"
          type="number"
          inputMode="numeric"
          defaultValue={vehiculo.anio ?? ""}
        />
        <FormField
          label="Intervalo de mantención (km)"
          name="intervalo_mantencion_km"
          type="number"
          inputMode="numeric"
          required
          defaultValue={vehiculo.intervalo_mantencion_km}
        />
      </div>
      <FormError message={state.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancelar} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
