"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { subirDocumento, type ActionState } from "@/app/dashboard/actions";
import { TIPOS_DOCUMENTO } from "@/lib/documentos";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { FormField } from "@/components/ui/FormField";

const initialState: ActionState = {};
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export function SubirDocumentoForm({ vehiculoId }: { vehiculoId: string }) {
  const subirConVehiculo = subirDocumento.bind(null, vehiculoId);
  const [state, formAction, isPending] = useActionState(subirConVehiculo, initialState);
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>();
  const formRef = useRef<HTMLFormElement>(null);
  const tipoId = `tipo-${vehiculoId}`;
  const archivoId = `archivo-${vehiculoId}`;

  useEffect(() => {
    // Si el submit llegó a pasar es porque errorArchivo ya estaba en
    // undefined (el botón queda deshabilitado mientras hay error), así que
    // alcanza con limpiar el formulario.
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  function handleArchivoChange(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    // Chequeo rápido en el navegador para no hacer esperar al usuario un
    // viaje al server con un archivo que sabemos que va a rebotar. La
    // validación real (tamaño y tipo real del archivo) pasa igual en el
    // server action.
    if (archivo && archivo.size > TAMANO_MAXIMO_BYTES) {
      setErrorArchivo("El archivo no puede pesar más de 5MB.");
      e.target.value = "";
    } else {
      setErrorArchivo(undefined);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm sm:p-5"
    >
      <h4 className="text-base font-medium text-text">Subir documento</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={tipoId} className="block text-sm font-medium text-text">
            Tipo de documento
          </label>
          <select
            id={tipoId}
            name="tipo"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-md border-2 border-border-strong bg-bg-card px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="" disabled>
              Seleccioná un tipo
            </option>
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
        <FormField
          label="Fecha de vencimiento"
          name="fecha_vencimiento"
          type="date"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={archivoId} className="block text-sm font-medium text-text">
          Archivo (PDF, JPG o PNG, máx. 5MB)
        </label>
        <input
          id={archivoId}
          name="archivo"
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={handleArchivoChange}
          className="block w-full text-base text-text file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-md file:border-2 file:border-border-strong file:bg-bg-card file:px-4 file:py-2 file:text-base file:font-medium file:text-text"
        />
      </div>

      <FormError message={errorArchivo ?? state.error} />

      <Button type="submit" disabled={isPending || !!errorArchivo}>
        {isPending ? "Subiendo..." : "Subir documento"}
      </Button>
    </form>
  );
}
