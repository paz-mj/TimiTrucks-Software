"use client";

import { useActionState, useEffect, useRef } from "react";
import { actualizarKm, type ActualizarKmState } from "@/app/mi-vehiculo/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { FormField } from "@/components/ui/FormField";

const initialState: ActualizarKmState = {};

interface ActualizarKmFormProps {
  vehiculoId: string;
  kmActual: number;
}

export function ActualizarKmForm({ vehiculoId, kmActual }: ActualizarKmFormProps) {
  const actualizarConId = actualizarKm.bind(null, vehiculoId);
  const [state, formAction, isPending] = useActionState(actualizarConId, initialState);
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
      className="space-y-3 rounded-lg border-2 border-border bg-bg-card p-4 sm:p-5"
    >
      <h2 className="text-lg font-medium text-text">Actualizar kilometraje</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormField
            label="Kilometraje actual"
            name="km"
            type="number"
            inputMode="numeric"
            required
            min={kmActual}
            defaultValue={kmActual}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
