"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearFlota, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { FormField } from "@/components/ui/FormField";

const initialState: ActionState = {};

export function CrearFlotaForm() {
  const [state, formAction, isPending] = useActionState(crearFlota, initialState);
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
      <h2 className="text-lg font-medium text-text">Crear flota</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormField label="Nombre de la flota" name="nombre" required />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear flota"}
        </Button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
