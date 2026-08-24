"use client";

import { useActionState } from "react";
import { asignarConductor, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

const initialState: ActionState = {};

interface Conductor {
  id: string;
  nombre: string | null;
}

interface AsignarConductorFormProps {
  vehiculoId: string;
  conductorActualId: string | null;
  conductoresDisponibles: Conductor[];
}

export function AsignarConductorForm({
  vehiculoId,
  conductorActualId,
  conductoresDisponibles,
}: AsignarConductorFormProps) {
  const asignarConId = asignarConductor.bind(null, vehiculoId);
  const [state, formAction, isPending] = useActionState(asignarConId, initialState);
  const selectId = `conductor-${vehiculoId}`;

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor={selectId} className="block text-sm font-medium text-text">
            Conductor asignado
          </label>
          <select
            id={selectId}
            name="conductor_id"
            defaultValue={conductorActualId ?? ""}
            className="min-h-11 w-full rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="">Sin asignar</option>
            {conductoresDisponibles.map((conductor) => (
              <option key={conductor.id} value={conductor.id}>
                {conductor.nombre ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
