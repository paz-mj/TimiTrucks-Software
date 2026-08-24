import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

export function FormField({ label, name, className = "", ...props }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`min-h-11 w-full rounded-md border-2 border-border-strong px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
        {...props}
      />
    </div>
  );
}
