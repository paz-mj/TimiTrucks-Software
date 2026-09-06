"use client";

import { useActionState } from "react";
import { actualizarObservaciones, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

const initialState: ActionState = {};

interface ObservacionesFormProps {
  vehiculoId: string;
  observaciones: string | null;
}

export function ObservacionesForm({ vehiculoId, observaciones }: ObservacionesFormProps) {
  const actualizarConId = actualizarObservaciones.bind(null, vehiculoId);
  const [state, formAction, isPending] = useActionState(actualizarConId, initialState);
  const textareaId = `observaciones-${vehiculoId}`;

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor={textareaId} className="block text-sm font-medium text-text">
        Observaciones
      </label>
      <textarea
        id={textareaId}
        name="observaciones"
        rows={3}
        defaultValue={observaciones ?? ""}
        placeholder="Notas internas sobre este vehículo (opcional)"
        className="w-full rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <FormError message={state.error} />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar observaciones"}
      </Button>
    </form>
  );
}
