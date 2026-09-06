"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { subirFotoVehiculo, type ActionState } from "@/app/dashboard/actions";
import { FotoVehiculo } from "@/components/flotas/FotoVehiculo";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

const initialState: ActionState = {};
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;

interface SubirFotoVehiculoFormProps {
  vehiculoId: string;
  patente: string;
  fotoUrl: string | null;
}

export function SubirFotoVehiculoForm({
  vehiculoId,
  patente,
  fotoUrl,
}: SubirFotoVehiculoFormProps) {
  const subirConVehiculo = subirFotoVehiculo.bind(null, vehiculoId);
  const [state, formAction, isPending] = useActionState(subirConVehiculo, initialState);
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>();
  const formRef = useRef<HTMLFormElement>(null);
  const fotoId = `foto-${vehiculoId}`;

  useEffect(() => {
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    // Chequeo rápido en el navegador; la validación real (tamaño y tipo real
    // del archivo) pasa igual en el server action.
    if (archivo && archivo.size > TAMANO_MAXIMO_BYTES) {
      setErrorArchivo("La imagen no puede pesar más de 2MB.");
      e.target.value = "";
    } else {
      setErrorArchivo(undefined);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <FotoVehiculo fotoUrl={fotoUrl} patente={patente} className="h-16 w-16" />

      <div className="flex-1 space-y-1.5">
        <label htmlFor={fotoId} className="block text-sm font-medium text-text">
          Foto del vehículo (JPG o PNG, máx. 2MB)
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={fotoId}
            name="foto"
            type="file"
            required
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFotoChange}
            className="block flex-1 text-base text-text file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border-2 file:border-border-strong file:bg-bg-card file:px-4 file:py-2 file:text-base file:font-medium file:text-text"
          />
          <Button type="submit" variant="secondary" disabled={isPending || !!errorArchivo}>
            <Camera size={18} aria-hidden="true" />
            {isPending ? "Subiendo..." : "Guardar foto"}
          </Button>
        </div>
        <FormError message={errorArchivo ?? state.error} />
      </div>
    </form>
  );
}
