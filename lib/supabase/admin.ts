import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Cliente con la secret key: se salta RLS por completo.
// SOLO para usar en el cron (/api/cron/*) y el webhook de Telegram
// (/api/telegram/webhook), nunca en codigo que corra en el browser ni
// en rutas que respondan directo a un usuario logueado.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
