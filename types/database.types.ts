// Tipos generados a mano a partir de supabase/schema.sql (fuente de verdad).
// Si el schema cambia, hay que actualizar este archivo a mano tambien
// (no tenemos Supabase CLI linkeado al proyecto para correr
// `supabase gen types typescript` todavia).

export type RolUsuario = "superadmin" | "admin" | "conductor";
export type TipoDocumento =
  | "permiso_circulacion"
  | "revision_tecnica"
  | "seguro"
  | "otro";

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nombre: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          empresa_id: string | null;
          rol: RolUsuario;
          nombre: string | null;
          telegram_chat_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          empresa_id?: string | null;
          rol?: RolUsuario;
          nombre?: string | null;
          telegram_chat_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string | null;
          rol?: RolUsuario;
          nombre?: string | null;
          telegram_chat_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      flotas: {
        Row: {
          id: string;
          empresa_id: string;
          nombre: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nombre: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nombre?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      vehiculos: {
        Row: {
          id: string;
          flota_id: string;
          conductor_id: string | null;
          patente: string;
          marca: string | null;
          modelo: string | null;
          anio: number | null;
          km_actual: number;
          km_ultima_mantencion: number;
          intervalo_mantencion_km: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          flota_id: string;
          conductor_id?: string | null;
          patente: string;
          marca?: string | null;
          modelo?: string | null;
          anio?: number | null;
          km_actual?: number;
          km_ultima_mantencion?: number;
          intervalo_mantencion_km?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          flota_id?: string;
          conductor_id?: string | null;
          patente?: string;
          marca?: string | null;
          modelo?: string | null;
          anio?: number | null;
          km_actual?: number;
          km_ultima_mantencion?: number;
          intervalo_mantencion_km?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          vehiculo_id: string;
          tipo: TipoDocumento;
          archivo_url: string;
          fecha_vencimiento: string;
          fecha_subida: string;
          subido_por: string | null;
        };
        Insert: {
          id?: string;
          vehiculo_id: string;
          tipo: TipoDocumento;
          archivo_url: string;
          fecha_vencimiento: string;
          fecha_subida?: string;
          subido_por?: string | null;
        };
        Update: {
          id?: string;
          vehiculo_id?: string;
          tipo?: TipoDocumento;
          archivo_url?: string;
          fecha_vencimiento?: string;
          fecha_subida?: string;
          subido_por?: string | null;
        };
        Relationships: [];
      };
      km_historial: {
        Row: {
          id: string;
          vehiculo_id: string;
          km: number;
          fecha: string;
          usuario_id: string | null;
        };
        Insert: {
          id?: string;
          vehiculo_id: string;
          km: number;
          fecha?: string;
          usuario_id?: string | null;
        };
        Update: {
          id?: string;
          vehiculo_id?: string;
          km?: number;
          fecha?: string;
          usuario_id?: string | null;
        };
        Relationships: [];
      };
      notificaciones_log: {
        Row: {
          id: string;
          tipo: string;
          vehiculo_id: string | null;
          referencia_id: string | null;
          enviado_at: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          vehiculo_id?: string | null;
          referencia_id?: string | null;
          enviado_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          vehiculo_id?: string | null;
          referencia_id?: string | null;
          enviado_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      actualizar_km: {
        Args: {
          p_vehiculo_id: string;
          p_km: number;
        };
        Returns: void;
      };
      my_rol: {
        Args: Record<string, never>;
        Returns: RolUsuario;
      };
      my_empresa: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      rol_usuario: RolUsuario;
      tipo_documento: TipoDocumento;
    };
  };
}
