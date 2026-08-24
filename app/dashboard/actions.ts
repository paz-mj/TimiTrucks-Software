"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction, type AdminSupabaseClient } from "@/lib/supabase/admin-context";
import { esTipoDocumentoValido } from "@/lib/documentos";
import { detectarMimeReal, EXTENSION_POR_MIME } from "@/lib/validar-archivo";

export interface ActionState {
  error?: string;
}

const ANIO_MINIMO = 1950;
const TAMANO_MAXIMO_ARCHIVO = 5 * 1024 * 1024; // 5MB

function parsePatente(formData: FormData) {
  return String(formData.get("patente") ?? "")
    .trim()
    .toUpperCase();
}

function parseTexto(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor || null;
}

function parseAnio(formData: FormData): { anio: number | null; error?: string } {
  const raw = formData.get("anio");
  if (!raw || raw === "") return { anio: null };

  const anio = Number(raw);
  const anioMaximo = new Date().getFullYear() + 1;
  if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > anioMaximo) {
    return { anio: null, error: `El año debe estar entre ${ANIO_MINIMO} y ${anioMaximo}.` };
  }
  return { anio };
}

function parseIntervalo(formData: FormData): { intervalo: number | null; error?: string } {
  const raw = formData.get("intervalo_mantencion_km");
  const intervalo = Number(raw);
  if (!raw || !Number.isInteger(intervalo) || intervalo <= 0) {
    return { intervalo: null, error: "El intervalo de mantención debe ser un número entero mayor a 0." };
  }
  return { intervalo };
}

// Vuelve a chequear que el vehiculo pertenezca a una flota de la empresa del
// admin logueado. Devuelve el flota_id si es valido, o null si no.
async function verificarVehiculoDeEmpresa(
  supabase: AdminSupabaseClient,
  vehiculoId: string,
  empresaId: string,
): Promise<string | null> {
  const { data: vehiculo } = await supabase
    .from("vehiculos")
    .select("flota_id")
    .eq("id", vehiculoId)
    .maybeSingle();

  if (!vehiculo) return null;

  const { data: flota } = await supabase
    .from("flotas")
    .select("id")
    .eq("id", vehiculo.flota_id)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  return flota ? vehiculo.flota_id : null;
}

export async function crearFlota(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const { error } = await ctx.supabase
    .from("flotas")
    .insert({ nombre, empresa_id: ctx.empresaId });

  if (error) return { error: "No se pudo crear la flota." };

  revalidatePath("/dashboard");
  return {};
}

export async function crearVehiculo(
  flotaId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const patente = parsePatente(formData);
  if (!patente) return { error: "La patente es obligatoria." };

  const { anio, error: errorAnio } = parseAnio(formData);
  if (errorAnio) return { error: errorAnio };

  const { intervalo, error: errorIntervalo } = parseIntervalo(formData);
  if (errorIntervalo) return { error: errorIntervalo };

  // Re-verificamos que la flota sea de la empresa del admin antes de
  // escribir, aunque RLS ya lo protegería a nivel de base de datos.
  const { data: flota } = await ctx.supabase
    .from("flotas")
    .select("id")
    .eq("id", flotaId)
    .eq("empresa_id", ctx.empresaId)
    .maybeSingle();

  if (!flota) return { error: "No autorizado." };

  const { error } = await ctx.supabase.from("vehiculos").insert({
    flota_id: flotaId,
    patente,
    marca: parseTexto(formData, "marca"),
    modelo: parseTexto(formData, "modelo"),
    anio,
    intervalo_mantencion_km: intervalo!,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un vehículo con esa patente." };
    }
    return { error: "No se pudo crear el vehículo." };
  }

  revalidatePath(`/dashboard/flotas/${flotaId}`);
  return {};
}

export async function actualizarVehiculo(
  vehiculoId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const patente = parsePatente(formData);
  if (!patente) return { error: "La patente es obligatoria." };

  const { anio, error: errorAnio } = parseAnio(formData);
  if (errorAnio) return { error: errorAnio };

  const { intervalo, error: errorIntervalo } = parseIntervalo(formData);
  if (errorIntervalo) return { error: errorIntervalo };

  const flotaId = await verificarVehiculoDeEmpresa(ctx.supabase, vehiculoId, ctx.empresaId);
  if (!flotaId) return { error: "No autorizado." };

  const { error } = await ctx.supabase
    .from("vehiculos")
    .update({
      patente,
      marca: parseTexto(formData, "marca"),
      modelo: parseTexto(formData, "modelo"),
      anio,
      intervalo_mantencion_km: intervalo!,
    })
    .eq("id", vehiculoId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un vehículo con esa patente." };
    }
    return { error: "No se pudo actualizar el vehículo." };
  }

  revalidatePath(`/dashboard/flotas/${flotaId}`);
  return {};
}

export async function asignarConductor(
  vehiculoId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const conductorId = String(formData.get("conductor_id") ?? "").trim() || null;

  const flotaId = await verificarVehiculoDeEmpresa(ctx.supabase, vehiculoId, ctx.empresaId);
  if (!flotaId) return { error: "No autorizado." };

  if (conductorId) {
    // El conductor tiene que ser de la misma empresa y tener ese rol; no
    // confiamos en que el id que llegó del formulario sea válido.
    const { data: conductor } = await ctx.supabase
      .from("profiles")
      .select("id")
      .eq("id", conductorId)
      .eq("empresa_id", ctx.empresaId)
      .eq("rol", "conductor")
      .maybeSingle();

    if (!conductor) return { error: "No autorizado." };
  }

  const { error } = await ctx.supabase
    .from("vehiculos")
    .update({ conductor_id: conductorId })
    .eq("id", vehiculoId);

  if (error) return { error: "No se pudo asignar el conductor." };

  revalidatePath(`/dashboard/flotas/${flotaId}`);
  return {};
}

export async function eliminarVehiculo(
  vehiculoId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const flotaId = await verificarVehiculoDeEmpresa(ctx.supabase, vehiculoId, ctx.empresaId);
  if (!flotaId) return { error: "No autorizado." };

  const { error } = await ctx.supabase.from("vehiculos").delete().eq("id", vehiculoId);
  if (error) return { error: "No se pudo eliminar el vehículo." };

  revalidatePath(`/dashboard/flotas/${flotaId}`);
  return {};
}

// Igual que verificarVehiculoDeEmpresa, pero partiendo de un documento: junta
// su vehiculo_id y confirma que ese vehiculo sea de la empresa del admin.
// Devuelve {flotaId, vehiculoId, archivoPath} o null si no corresponde.
async function verificarDocumentoDeEmpresa(
  supabase: AdminSupabaseClient,
  documentoId: string,
  empresaId: string,
): Promise<{ flotaId: string; vehiculoId: string; archivoPath: string } | null> {
  const { data: documento } = await supabase
    .from("documentos")
    .select("vehiculo_id, archivo_url")
    .eq("id", documentoId)
    .maybeSingle();

  if (!documento) return null;

  const flotaId = await verificarVehiculoDeEmpresa(supabase, documento.vehiculo_id, empresaId);
  if (!flotaId) return null;

  return { flotaId, vehiculoId: documento.vehiculo_id, archivoPath: documento.archivo_url };
}

export async function subirDocumento(
  vehiculoId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const flotaId = await verificarVehiculoDeEmpresa(ctx.supabase, vehiculoId, ctx.empresaId);
  if (!flotaId) return { error: "No autorizado." };

  const tipo = String(formData.get("tipo") ?? "");
  if (!esTipoDocumentoValido(tipo)) return { error: "Elegí un tipo de documento válido." };

  const fechaVencimiento = String(formData.get("fecha_vencimiento") ?? "");
  if (!fechaVencimiento) return { error: "La fecha de vencimiento es obligatoria." };
  if (Number.isNaN(Date.parse(fechaVencimiento))) {
    return { error: "La fecha de vencimiento no es válida." };
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Tenés que seleccionar un archivo." };
  }

  // Tamaño: esto ya se chequea en el formulario para no hacer subir datos
  // al usuario innecesariamente, pero la validación que realmente cuenta es
  // esta, del lado del server.
  if (archivo.size > TAMANO_MAXIMO_ARCHIVO) {
    return { error: "El archivo no puede pesar más de 5MB." };
  }

  // No confiamos en archivo.type (lo arma el navegador a partir del nombre)
  // ni en la extensión: miramos los primeros bytes del archivo.
  const mimeReal = await detectarMimeReal(archivo);
  const extension = mimeReal ? EXTENSION_POR_MIME[mimeReal] : undefined;
  if (!mimeReal || !extension) {
    return { error: "Solo se aceptan archivos PDF, JPG o PNG." };
  }

  const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
  const path = `${ctx.empresaId}/${vehiculoId}/${nombreArchivo}`;

  const { error: errorStorage } = await ctx.supabase.storage
    .from("documentos")
    .upload(path, archivo, { contentType: mimeReal, upsert: false });

  if (errorStorage) return { error: "No se pudo subir el archivo." };

  const { error: errorInsert } = await ctx.supabase.from("documentos").insert({
    vehiculo_id: vehiculoId,
    tipo,
    archivo_url: path,
    fecha_vencimiento: fechaVencimiento,
    subido_por: ctx.userId,
  });

  if (errorInsert) {
    // No dejamos el archivo huérfano en Storage si la fila no se pudo crear.
    await ctx.supabase.storage.from("documentos").remove([path]);
    return { error: "No se pudo guardar el documento." };
  }

  revalidatePath(`/dashboard/flotas/${flotaId}`);
  return {};
}

export async function eliminarDocumento(
  documentoId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const documento = await verificarDocumentoDeEmpresa(ctx.supabase, documentoId, ctx.empresaId);
  if (!documento) return { error: "No autorizado." };

  // Primero el archivo: si esto falla, no tocamos la fila y queda todo
  // consistente para reintentar. Si borráramos la fila primero y esto
  // fallara después, el archivo quedaría huérfano en Storage sin ninguna
  // fila que lo referencie ni forma de volver a intentarlo desde la UI.
  const { error: errorStorage } = await ctx.supabase.storage
    .from("documentos")
    .remove([documento.archivoPath]);

  if (errorStorage) return { error: "No se pudo eliminar el archivo." };

  const { error: errorDelete } = await ctx.supabase
    .from("documentos")
    .delete()
    .eq("id", documentoId);

  if (errorDelete) return { error: "No se pudo eliminar el documento." };

  revalidatePath(`/dashboard/flotas/${documento.flotaId}`);
  return {};
}

const SEGUNDOS_VIGENCIA_URL_FIRMADA = 60;

export async function obtenerUrlDocumento(
  documentoId: string,
): Promise<{ url?: string; error?: string }> {
  const ctx = await requireAdminAction();
  if (!ctx) return { error: "No autorizado." };

  const documento = await verificarDocumentoDeEmpresa(ctx.supabase, documentoId, ctx.empresaId);
  if (!documento) return { error: "No autorizado." };

  const { data, error } = await ctx.supabase.storage
    .from("documentos")
    .createSignedUrl(documento.archivoPath, SEGUNDOS_VIGENCIA_URL_FIRMADA);

  if (error || !data) return { error: "No se pudo generar el enlace del documento." };

  return { url: data.signedUrl };
}
