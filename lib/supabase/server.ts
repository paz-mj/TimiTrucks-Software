import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

// Cliente para Server Components / Route Handlers / Server Actions.
// Usa la publishable key: respeta RLS segun el usuario logueado (via cookies).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll puede fallar si se llama desde un Server Component sin
            // response mutable (ej. renderizado estatico). El middleware ya
            // se encarga de refrescar la sesion en ese caso.
          }
        },
      },
    },
  );
}
