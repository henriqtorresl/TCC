"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.15),_transparent_45%)]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_30px_120px_rgba(2,8,23,0.45)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
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
                Criar conta com experiência premium
              </h1>
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-foreground/75">
              <Sparkles className="size-3.5 text-primary" />
              Setup rápido para a equipe clínica
            </div>
            <p className="max-w-md text-3xl font-semibold tracking-tight text-foreground">
              Um cadastro simples, elegante e pronto para uso profissional.
            </p>
            <p className="max-w-lg text-sm leading-7 text-foreground/70">
              Mantemos a operação ágil e refinamos a interface para parecer uma
              solução SaaS madura, confiável e legível.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-foreground/70">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <ShieldCheck className="size-4 text-primary" />
              Campos com foco em legibilidade e estados claros
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <ArrowRight className="size-4 text-primary" />
              Fluxo otimizado para desktop e dispositivos móveis
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
              <h1 className="text-xl font-semibold tracking-tight">Criar conta</h1>
            </div>
          </div>

          <div className="mb-6 hidden lg:block">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-foreground/55">
              Cadastro
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Crie sua conta
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
              Cadastre seus dados para acessar o assistente médico e começar a
              registrar atendimentos.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">
                Nome completo
              </span>
              <Input
                type="text"
                autoComplete="name"
                className="h-12 w-full placeholder:text-foreground/35"
                placeholder="Seu nome"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isLoading}
                required
              />
            </label>

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
                autoComplete="new-password"
                className="h-12 w-full placeholder:text-foreground/35"
                placeholder="Crie sua senha"
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
              {isLoading ? "Criando conta..." : "Cadastrar"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-foreground/70">
            Já tem conta?{" "}
            <Link
              className="font-medium text-primary transition hover:text-primary/90"
              href="/login"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
