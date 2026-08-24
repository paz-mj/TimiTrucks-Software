"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { FormError } from "@/components/ui/FormError";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border-2 border-border bg-bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Truck size={40} className="text-primary" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-text">
            Flota Tracker
          </h1>
          <p className="text-sm text-text-secondary">
            Ingresá con tu correo y contraseña
          </p>
        </div>

        <FormField
          label="Correo"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FormField
          label="Contraseña"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <FormError message={error ?? undefined} />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </main>
  );
}
