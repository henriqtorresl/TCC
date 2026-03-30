"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorPayload = {
  error?: string | { message?: string };
};

function getErrorMessage(payload: ErrorPayload | null, fallback: string): string {
  if (!payload?.error) {
    return fallback;
  }

  if (typeof payload.error === "string") {
    if (payload.error === "email_already_in_use") {
      return "Este email já está em uso.";
    }
    if (payload.error === "database_not_configured") {
      return "Banco de dados indisponível no momento.";
    }
    return payload.error;
  }

  return payload.error.message || fallback;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ErrorPayload
        | null;

      if (!response.ok) {
        setError(
          getErrorMessage(payload, "Não foi possível concluir o cadastro."),
        );
        return;
      }

      router.replace(`/login?registered=1&email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError("Erro de conexão. Verifique sua rede e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_35%)]" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
            <Stethoscope className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Criar conta</h1>
            <p className="text-sm text-zinc-400">Cadastre-se para iniciar</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Nome completo</span>
            <input
              type="text"
              autoComplete="name"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-emerald-400/40 placeholder:text-zinc-500 focus:ring-2"
              placeholder="Seu nome"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isLoading}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-emerald-400/40 placeholder:text-zinc-500 focus:ring-2"
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Senha</span>
            <input
              type="password"
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-emerald-400/40 placeholder:text-zinc-500 focus:ring-2"
              placeholder="Crie sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
            disabled={isLoading}
          >
            {isLoading ? "Criando conta..." : "Cadastrar"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-zinc-400">
          Já tem conta?{" "}
          <Link className="text-emerald-400 hover:text-emerald-300" href="/login">
            Fazer login
          </Link>
        </p>
      </section>
    </main>
  );
}
