import { Truck } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

interface AppHeaderProps {
  titulo: string;
}

export function AppHeader({ titulo }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b-2 border-border bg-bg-card px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <Truck size={28} className="text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-text">{titulo}</h1>
      </div>
      <LogoutButton />
    </header>
  );
}
