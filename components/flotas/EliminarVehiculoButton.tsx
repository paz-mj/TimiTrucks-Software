"use client";

import { useActionState, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { eliminarVehiculo, type ActionState } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const initialState: ActionState = {};

export function EliminarVehiculoButton({
  vehiculoId,
  patente,
}: {
  vehiculoId: string;
  patente: string;
}) {
  const eliminarConId = eliminarVehiculo.bind(null, vehiculoId);
  const [state, formAction, isPending] = useActionState(eliminarConId, initialState);
  const [confirmando, setConfirmando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function confirmarEliminacion() {
    setConfirmando(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={formAction}>
        <Button
          variant="secondary"
          type="button"
          disabled={isPending}
          onClick={() => setConfirmando(true)}
        >
          <Trash2 size={18} className="text-danger" aria-hidden="true" />
          {isPending ? "Eliminando..." : "Eliminar"}
        </Button>
        <FormError message={state.error} />
      </form>

      <ConfirmDialog
        open={confirmando}
        titulo="Eliminar vehículo"
        descripcion={`¿Eliminar el vehículo ${patente}? Esta acción no se puede deshacer.`}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
