import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminSupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Unico lugar que decide si un usuario puede administrar flotas/vehiculos:
// rol admin o superadmin, Y con empresa_id asignado (sin empresa no hay
// contexto para saber que datos administra). RLS en Supabase ya bloquea
// escrituras cruzadas entre empresas; esto es una verificacion adicional
// en el server antes de siquiera intentar la operacion.
async function getAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, empresaId: null, nombre: null } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, empresa_id, nombre")
    .eq("id", user.id)
    .single();

  const esAdmin =
    !!profile &&
    (profile.rol === "admin" || profile.rol === "superadmin") &&
    !!profile.empresa_id;

  return {
    supabase,
    user,
    empresaId: esAdmin ? (profile!.empresa_id as string) : null,
    nombre: profile?.nombre ?? null,
  } as const;
}

// Para Server Components (paginas): redirige en vez de fallar silencioso.
export async function requireAdminPage() {
  const { supabase, user, empresaId, nombre } = await getAdminProfile();

  if (!user) {
    redirect("/login");
  }
  if (!empresaId) {
    redirect("/mi-vehiculo");
  }

  return { supabase, empresaId, nombre };
}

// Para Server Actions: nunca redirige (rompería el flujo de un form action),
// devuelve null y quien llama decide como responder.
export async function requireAdminAction() {
  const { supabase, user, empresaId } = await getAdminProfile();

  if (!user || !empresaId) {
    return null;
  }

  return { supabase, empresaId, userId: user.id };
}
