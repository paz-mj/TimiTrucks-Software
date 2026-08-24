import { FileText } from "lucide-react";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { SubirDocumentoForm } from "@/components/flotas/SubirDocumentoForm";
import { EliminarDocumentoButton } from "@/components/flotas/EliminarDocumentoButton";
import { VerDocumentoButton } from "@/components/flotas/VerDocumentoButton";
import { calcularEstadoDocumento, etiquetaTipoDocumento } from "@/lib/documentos";
import type { TipoDocumento } from "@/types/database.types";

interface Documento {
  id: string;
  tipo: TipoDocumento;
  fecha_vencimiento: string;
}

export function DocumentosSection({
  vehiculoId,
  documentos,
}: {
  vehiculoId: string;
  documentos: Documento[];
}) {
  return (
    <div className="space-y-3 border-t-2 border-border pt-4">
      <h4 className="flex items-center gap-2 text-base font-medium text-text">
        <FileText size={20} className="text-text-secondary" aria-hidden="true" />
        Documentos
      </h4>

      {documentos.length === 0 ? (
        <p className="text-sm text-text-secondary">Sin documentos cargados.</p>
      ) : (
        <ul className="space-y-2">
          {documentos.map((documento) => {
            const etiqueta = etiquetaTipoDocumento(documento.tipo);
            return (
              <li
                key={documento.id}
                className="flex flex-col gap-2 rounded-md border-2 border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-medium text-text">{etiqueta}</p>
                  <p className="text-sm text-text-secondary">
                    Vence el{" "}
                    {new Date(`${documento.fecha_vencimiento}T00:00:00`).toLocaleDateString(
                      "es-CL",
                      { dateStyle: "medium" },
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EstadoBadge estado={calcularEstadoDocumento(documento.fecha_vencimiento)} />
                  <VerDocumentoButton documentoId={documento.id} />
                  <EliminarDocumentoButton documentoId={documento.id} etiqueta={etiqueta} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SubirDocumentoForm vehiculoId={vehiculoId} />
    </div>
  );
}
