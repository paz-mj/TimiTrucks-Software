"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearVehiculo, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { FormField } from "@/components/ui/FormField";

const initialState: ActionState = {};

export function CrearVehiculoForm({ flotaId }: { flotaId: string }) {
  const crearConFlota = crearVehiculo.bind(null, flotaId);
  const [state, formAction, isPending] = useActionState(crearConFlota, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border-2 border-border bg-bg-card p-4 sm:p-5"
    >
      <h2 className="text-lg font-medium text-text">Agregar vehículo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Patente" name="patente" required />
        <FormField label="Marca" name="marca" />
        <FormField label="Modelo" name="modelo" />
        <FormField label="Año" name="anio" type="number" inputMode="numeric" />
        <FormField
          label="Intervalo de mantención (km)"
          name="intervalo_mantencion_km"
          type="number"
          inputMode="numeric"
          required
          defaultValue={10000}
        />
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Agregando..." : "Agregar vehículo"}
      </Button>
    </form>
  );
}
