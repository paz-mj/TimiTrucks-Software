// Deriva el contexto de navegación (¿qué flota está seleccionada? ¿en qué
// sección?) a partir del pathname, en vez de duplicar esta lógica en Sidebar
// y TopBar por separado.
export interface DashboardContext {
  flotaId: string | null;
  enFlotasCrud: boolean;
  seccionSufijo: string;
}

export function getDashboardContext(pathname: string): DashboardContext {
  const partes = pathname.split("/").filter(Boolean); // ej: ["dashboard", "abc", "avisos"]
  const segundo = partes[1];

  if (!segundo || segundo === "flotas") {
    return { flotaId: partes[2] ?? null, enFlotasCrud: true, seccionSufijo: "" };
  }

  const resto = partes.slice(2).join("/");
  return {
    flotaId: segundo,
    enFlotasCrud: false,
    seccionSufijo: resto ? `/${resto}` : "",
  };
}
