"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearMantencion, type ActionState } from "@/app/dashboard/actions";
import { TIPOS_MANTENCION } from "@/lib/mantenciones";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { FormField } from "@/components/ui/FormField";

const initialState: ActionState = {};

interface Vehiculo {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
}

interface MantencionFormProps {
  flotaId: string;
  vehiculos: Vehiculo[];
}

function etiquetaVehiculo(vehiculo: Vehiculo): string {
  const detalle = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ");
  return detalle ? `${vehiculo.patente} — ${detalle}` : vehiculo.patente;
}

export function MantencionForm({ flotaId, vehiculos }: MantencionFormProps) {
  const crearConFlota = crearMantencion.bind(null, flotaId);
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
      className="space-y-4 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm sm:p-5"
    >
      <h2 className="text-lg font-medium text-text">Registrar mantención o repuesto</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="vehiculo_id" className="block text-sm font-medium text-text">
            ¿Para qué vehículo?
          </label>
          <select
            id="vehiculo_id"
            name="vehiculo_id"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="" disabled>
              Seleccioná un vehículo
            </option>
            {vehiculos.map((vehiculo) => (
              <option key={vehiculo.id} value={vehiculo.id}>
                {etiquetaVehiculo(vehiculo)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tipo" className="block text-sm font-medium text-text">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="" disabled>
              Seleccioná un tipo
            </option>
            {TIPOS_MANTENCION.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="descripcion" className="block text-sm font-medium text-text">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          rows={3}
          placeholder="Ej: Cambio de aceite y filtros, cambio de neumático delantero izquierdo..."
          className="w-full rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>

      <FormField
        label="Km al momento del registro (opcional)"
        name="km"
        type="number"
        inputMode="numeric"
        min={0}
      />
      <p className="-mt-2 text-sm text-text-secondary">
        Si es una mantención y cargás el km, se actualiza el contador de mantención del
        vehículo (limpia el aviso de “por vencer”/“vencido”).
      </p>

      <FormError message={state.error} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Registrar"}
      </Button>
    </form>
  );
}
