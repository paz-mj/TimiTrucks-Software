"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActualizarKmState {
  error?: string;
}

export async function actualizarKm(
  vehiculoId: string,
  _prevState: ActualizarKmState,
  formData: FormData,
): Promise<ActualizarKmState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const kmRaw = formData.get("km");
  const km = Number(kmRaw);

  if (kmRaw === null || kmRaw === "" || !Number.isInteger(km) || km < 0) {
    return { error: "Ingresá un kilometraje válido." };
  }

  // Nunca actualizamos vehiculos directo: la funcion actualizar_km valida
  // en la base de datos quien puede tocar este vehiculo y que el km no
  // retroceda, y deja registro en km_historial en la misma transaccion.
  const { error } = await supabase.rpc("actualizar_km", {
    p_vehiculo_id: vehiculoId,
    p_km: km,
  });

  if (error) {
    // error.message viene directo del RAISE EXCEPTION de la funcion SQL,
    // que ya está escrito en español legible (no es JSON ni un mensaje
    // interno de Postgres).
    return { error: error.message || "No se pudo actualizar el kilometraje." };
  }

  revalidatePath("/mi-vehiculo");
  return {};
}
