import { redirect } from "next/navigation";
import { History, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { calcularEstadoMantencion } from "@/lib/mantencion";
import { ActualizarKmForm } from "@/components/mi-vehiculo/ActualizarKmForm";

export default async function MiVehiculoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: vehiculo } = await supabase
    .from("vehiculos")
    .select(
      "id, patente, marca, modelo, km_actual, intervalo_mantencion_km, km_ultima_mantencion",
    )
    .eq("conductor_id", user.id)
    .maybeSingle();

  const { data: historial } = vehiculo
    ? await supabase
        .from("km_historial")
        .select("id, km, fecha")
        .eq("vehiculo_id", vehiculo.id)
        .order("fecha", { ascending: false })
        .limit(5)
    : { data: null };

  return (
    <>
      <AppHeader titulo="Mi vehículo" />
      <main className="space-y-6 p-4 sm:p-6">
        {!vehiculo ? (
          <p className="max-w-md text-base text-text-secondary">
            Todavía no tenés un vehículo asignado. Contactá a tu administrador.
          </p>
        ) : (
          <div className="max-w-md space-y-6">
            <VehiculoCard vehiculo={vehiculo} />
            <ActualizarKmForm vehiculoId={vehiculo.id} kmActual={vehiculo.km_actual} />
            <HistorialKm lecturas={historial ?? []} />
          </div>
        )}
      </main>
    </>
  );
}

interface VehiculoCardProps {
  vehiculo: {
    patente: string;
    marca: string | null;
    modelo: string | null;
    km_actual: number;
    intervalo_mantencion_km: number;
    km_ultima_mantencion: number;
  };
}

function VehiculoCard({ vehiculo }: VehiculoCardProps) {
  const { estado, kmRestante } = calcularEstadoMantencion(vehiculo);

  return (
    <div className="space-y-5 rounded-lg border-2 border-border bg-bg-card p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-text">
          {vehiculo.marca} {vehiculo.modelo}
        </h2>
        <p className="text-base text-text-secondary">
          Patente {vehiculo.patente}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-text-secondary">
          Kilometraje actual
        </p>
        <p className="text-3xl font-bold text-text">
          {vehiculo.km_actual.toLocaleString("es-CL")} km
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 border-t-2 border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-base text-text">
          <Wrench size={20} className="text-text-secondary" aria-hidden="true" />
          <span>
            {estado === "vencido"
              ? `Atrasada por ${Math.abs(kmRestante).toLocaleString("es-CL")} km`
              : `Faltan ${kmRestante.toLocaleString("es-CL")} km`}
          </span>
        </div>
        <EstadoBadge
          estado={estado}
          label={
            estado === "vencido"
              ? "Mantención atrasada"
              : estado === "por_vencer"
                ? "Mantención próxima"
                : "Al día"
          }
        />
      </div>
    </div>
  );
}

interface HistorialKmProps {
  lecturas: { id: string; km: number; fecha: string }[];
}

function HistorialKm({ lecturas }: HistorialKmProps) {
  return (
    <div className="space-y-3 rounded-lg border-2 border-border bg-bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-medium text-text">
        <History size={20} className="text-text-secondary" aria-hidden="true" />
        Últimas lecturas
      </h2>

      {lecturas.length === 0 ? (
        <p className="text-base text-text-secondary">Todavía no hay lecturas registradas.</p>
      ) : (
        <ul className="divide-y-2 divide-border">
          {lecturas.map((lectura) => (
            <li key={lectura.id} className="flex items-center justify-between py-2.5 text-base">
              <span className="text-text">{lectura.km.toLocaleString("es-CL")} km</span>
              <span className="text-sm text-text-secondary">
                {new Date(lectura.fecha).toLocaleString("es-CL", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
