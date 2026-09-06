"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

interface Flota {
  id: string;
  nombre: string;
}

interface DashboardChromeProps {
  flotas: Flota[];
  children: ReactNode;
}

export function DashboardChrome({ flotas, children }: DashboardChromeProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar flotas={flotas} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar flotas={flotas} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
