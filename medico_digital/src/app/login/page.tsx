"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.15),_transparent_45%)]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_30px_120px_rgba(2,8,23,0.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between border-r border-white/10 p-8 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_12px_30px_rgba(45,212,191,0.16)]">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
                Médico Digital
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                Anamnese com ritmo de produto premium
              </h1>
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-foreground/75">
              <Sparkles className="size-3.5 text-primary" />
              Interface pronta para fluxos clínicos intensivos
            </div>
            <p className="max-w-md text-3xl font-semibold tracking-tight text-foreground">
              Menos fricção para a equipe. Mais clareza para cada atendimento.
            </p>
            <p className="max-w-lg text-sm leading-7 text-foreground/70">
              Uma experiência visual mais limpa, legível e responsiva para
              transformar o chat clínico em um ambiente SaaS profissional.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-foreground/70">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <ShieldCheck className="size-4 text-primary" />
              Sessão autenticada com fluxo simples e confiável
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <ArrowRight className="size-4 text-primary" />
              Navegação otimizada para desktop e mobile
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_12px_30px_rgba(45,212,191,0.16)]">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
                Médico Digital
              </p>
              <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
            </div>
          </div>

          <div className="mb-6 hidden lg:block">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-foreground/55">
              Acesso
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Entrar na plataforma
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
              Use suas credenciais para continuar o atendimento e acessar o
              histórico de conversas.
            </p>
          </div>

          {hasRegistered && (
            <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Cadastro concluído. Faça login para continuar.
            </p>
          )}

          <form
            className="space-y-4"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">Email</span>
              <Input
                type="email"
                autoComplete="email"
                className="h-12 w-full placeholder:text-foreground/35"
                placeholder="voce@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">Senha</span>
              <Input
                type="password"
                autoComplete="current-password"
                className="h-12 w-full placeholder:text-foreground/35"
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                required
              />
            </label>

            {error && (
              <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="h-12 w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-foreground/70">
            Não tem conta?{" "}
            <Link
              className="font-medium text-primary transition hover:text-primary/90"
              href="/register"
            >
              Criar cadastro
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 text-foreground">
          <section className="surface-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm text-foreground/65">Carregando...</p>
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
