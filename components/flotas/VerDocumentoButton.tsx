"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { obtenerUrlDocumento } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

export function VerDocumentoButton({ documentoId }: { documentoId: string }) {
  const [error, setError] = useState<string | undefined>();
  const [cargando, setCargando] = useState(false);

  async function handleClick() {
    setError(undefined);
    setCargando(true);
    const resultado = await obtenerUrlDocumento(documentoId);
    setCargando(false);

    if (resultado.error || !resultado.url) {
      setError(resultado.error ?? "No se pudo abrir el documento.");
      return;
    }

    // URL firmada y de corta duración: nunca guardamos ni exponemos una URL
    // pública fija del archivo, se genera una nueva cada vez que se pide.
    window.open(resultado.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <Button variant="secondary" type="button" onClick={handleClick} disabled={cargando}>
        <Eye size={18} aria-hidden="true" />
        {cargando ? "Abriendo..." : "Ver"}
      </Button>
      <FormError message={error} />
    </div>
  );
}
