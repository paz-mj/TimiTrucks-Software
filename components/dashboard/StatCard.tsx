import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon size={18} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
    </div>
  );
}
