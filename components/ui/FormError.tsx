import { AlertTriangle } from "lucide-react";

export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="flex items-center gap-2 text-sm font-medium text-danger-text">
      <AlertTriangle size={18} aria-hidden="true" />
      {message}
    </p>
  );
}
