"use client";

import { useEffect, useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  titulo: string;
  descripcion: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const SELECTOR_ENFOCABLES =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  titulo,
  descripcion,
  confirmarLabel = "Eliminar",
  cancelarLabel = "Cancelar",
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const tituloId = useId();
  const descripcionId = useId();

  useEffect(() => {
    if (!open) return;

    // Foco inicial en "Cancelar", no en la acción destructiva: si alguien
    // aprieta Enter por reflejo apenas se abre, no borra nada.
    cancelarRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelar();
        return;
      }

      if (e.key !== "Tab") return;

      const enfocables = contenedorRef.current?.querySelectorAll<HTMLElement>(
        SELECTOR_ENFOCABLES,
      );
      if (!enfocables || enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancelar]);

  if (!open) return null;

  return (
    <div
      // Scrim intencionalmente en negro crudo (no --color-text): tiene que
      // quedar oscuro en los dos modos, y --color-text se vuelve claro en dark.
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancelar}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-5 rounded-lg border border-border-subtle bg-bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={24}
            className="mt-0.5 shrink-0 text-danger"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 id={tituloId} className="text-lg font-semibold text-text">
              {titulo}
            </h2>
            <p id={descripcionId} className="text-base text-text-secondary">
              {descripcion}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelarRef} type="button" variant="secondary" onClick={onCancelar}>
            {cancelarLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirmar}>
            {confirmarLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
