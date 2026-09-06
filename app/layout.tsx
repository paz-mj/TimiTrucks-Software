import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flota Tracker",
  description: "Seguimiento de flota: documentos, kilometraje y mantenciones",
};

// Corre antes de que React hidrate: si no, el usuario ve un flash en claro
// (el <html> nace sin la clase "dark") cada vez que recarga con el modo
// oscuro elegido. suppressHydrationWarning en <html> es necesario porque
// este script edita su className por fuera de React. Va como next/script
// con strategy="beforeInteractive" (no un <script> crudo de React) porque
// es el mecanismo que Next soporta para scripts bloqueantes en el head; un
// <script> plano dispara el warning "script tag while rendering".
const SCRIPT_TEMA_INICIAL = `
  try {
    var tema = localStorage.getItem("tema");
    var prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (tema === "dark" || (!tema && prefiereOscuro)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          id="tema-inicial"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }}
        />
        {children}
      </body>
    </html>
  );
}
