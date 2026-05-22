"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ErrorPayload = {
  error?: string | { message?: string };
};

type LoginPayload = ErrorPayload & {
  user?: { id?: number | string };
};

function getErrorMessage(
  payload: ErrorPayload | null,
  fallback: string,
): string {
  if (!payload?.error) {
    return fallback;
  }

  if (typeof payload.error === "string") {
    if (payload.error === "invalid_credentials") {
      return "Email ou senha inválidos.";
    }
    if (payload.error === "database_not_configured") {
      return "Banco de dados indisponível no momento.";
    }
    return payload.error;
  }

  return payload.error.message || fallback;
}

function normalizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectPath = useMemo(
    () => normalizeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const hasRegistered = searchParams.get("registered") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | LoginPayload
        | null;

      if (!response.ok) {
        setError(
          getErrorMessage(payload, "Não foi possível entrar. Tente novamente."),
        );
        return;
      }

      const userId = payload?.user?.id;
      if (userId !== undefined) {
        localStorage.setItem("md_user_id", String(userId));
      }

      router.replace(redirectPath);
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
            <h1 className="text-lg font-semibold">Entrar</h1>
            <p className="text-sm text-zinc-400">Acesse o assistente médico</p>
          </div>
        </div>

        {hasRegistered && (
          <p className="mb-4 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
            Cadastro concluído. Faça login para continuar.
          </p>
        )}

        <form
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Email</span>
            <Input
              type="email"
              autoComplete="email"
              className="h-11 w-full border-zinc-700 bg-zinc-950 text-sm ring-emerald-400/40 placeholder:text-zinc-500 focus-visible:ring-2"
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Senha</span>
            <Input
              type="password"
              autoComplete="current-password"
              className="h-11 w-full border-zinc-700 bg-zinc-950 text-sm ring-emerald-400/40 placeholder:text-zinc-500 focus-visible:ring-2"
              placeholder="Sua senha"
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
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-zinc-400">
          Não tem conta?{" "}
          <Link
            className="text-emerald-400 hover:text-emerald-300"
            href="/register"
          >
            Criar cadastro
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100">
          <section className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur md:p-8">
            <p className="text-sm text-zinc-400">Carregando...</p>
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
