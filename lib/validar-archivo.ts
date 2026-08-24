// Detecta el tipo real de un archivo por sus primeros bytes (firma/magic
// number), no por su extensión ni por el `file.type` que reporta el
// navegador — ambos vienen del cliente y se pueden falsificar con solo
// renombrar el archivo o armar el request a mano.
const FIRMAS: { mime: string; bytes: number[] }[] = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
];

export const EXTENSION_POR_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export async function detectarMimeReal(file: File): Promise<string | null> {
  const encabezado = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  for (const firma of FIRMAS) {
    if (firma.bytes.every((byte, i) => encabezado[i] === byte)) {
      return firma.mime;
    }
  }

  return null;
}
