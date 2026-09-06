"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Bell, Wrench, Truck, LogOut, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDashboardContext } from "@/lib/dashboard-nav";
import { DarkModeToggle } from "@/components/dashboard/DarkModeToggle";

interface Flota {
  id: string;
  nombre: string;
}

interface SidebarProps {
  flotas: Flota[];
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ flotas, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { flotaId, enFlotasCrud } = getDashboardContext(pathname);
  const flotaActiva = flotaId ?? flotas[0]?.id ?? null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navPrincipal = flotaActiva
    ? [
        { label: "Dashboard", icon: LayoutGrid, href: `/dashboard/${flotaActiva}` },
        { label: "Avisos", icon: Bell, href: `/dashboard/${flotaActiva}/avisos` },
        {
          label: "Mantenciones y Repuestos",
          icon: Wrench,
          href: `/dashboard/${flotaActiva}/mantenciones`,
        },
      ]
    : [];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border-subtle bg-bg-card p-3 transition-transform md:sticky md:top-0 md:z-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-2 flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <Truck size={24} className="text-primary" aria-hidden="true" />
            <span className="text-lg font-semibold text-text">Flota Tracker</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        {navPrincipal.length > 0 && (
          <nav className="flex flex-col gap-1">
            {navPrincipal.map((item) => {
              const activo = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={activo ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    activo
                      ? "bg-accent-bg text-accent"
                      : "text-text hover:bg-bg"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="my-2 border-t-2 border-border" />

        <nav className="flex flex-col gap-1">
          <Link
            href="/dashboard/flotas"
            onClick={onClose}
            aria-current={enFlotasCrud ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              enFlotasCrud ? "bg-accent-bg text-accent" : "text-text hover:bg-bg"
            }`}
          >
            <Truck size={20} aria-hidden="true" />
            Flotas
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-base font-medium text-text hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <LogOut size={20} aria-hidden="true" />
            Cerrar sesión
          </button>
        </nav>

        <div className="mt-auto border-t-2 border-border pt-2">
          <DarkModeToggle />
        </div>
      </aside>
    </>
  );
}
