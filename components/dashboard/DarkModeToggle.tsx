"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "tema";

export function DarkModeToggle() {
  // Guard de montaje: el server no tiene localStorage, así que su HTML
  // siempre es "claro". Si este componente arrancara ya sabiendo el valor
  // real (ej. leyéndolo en un lazy initializer de useState), el primer
  // render del cliente no coincidiría con ese HTML → hydration mismatch.
  // Por eso el primer render acá es SIEMPRE "claro" (igual que el server), y
  // recién en el useEffect post-montaje leemos la clase real del <html> (ya
  // la puso el script de app/layout.tsx) y actualizamos: eso ya es un
  // re-render normal post-hidratación, no un mismatch. Es la excepción
  // intencional a "no llames setState en un efecto": no hay forma de saber
  // este valor durante un render seguro para SSR.
  const [estado, setEstado] = useState({ montado: false, oscuro: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- excepción intencional, ver comentario arriba
    setEstado({ montado: true, oscuro: document.documentElement.classList.contains("dark") });
  }, []);

  const oscuroVisible = estado.montado && estado.oscuro;

  function alternar() {
    const nuevoOscuro = !estado.oscuro;
    setEstado((prev) => ({ ...prev, oscuro: nuevoOscuro }));
    document.documentElement.classList.toggle("dark", nuevoOscuro);
    localStorage.setItem(STORAGE_KEY, nuevoOscuro ? "dark" : "light");
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuroVisible}
      onClick={alternar}
      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-base font-medium text-text hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex items-center gap-2">
        {oscuroVisible ? (
          <Moon size={20} aria-hidden="true" />
        ) : (
          <Sun size={20} aria-hidden="true" />
        )}
        Modo oscuro
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          oscuroVisible ? "bg-primary" : "bg-border-strong"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-bg-card transition-transform ${
            oscuroVisible ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
