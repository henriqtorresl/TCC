"use client";

import { Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Patient = {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  birth_date: string | null;
  cpf: string | null;
  phone: string | null;
  gender: "male" | "female" | "other" | "unknown" | null;
  created_at: string;
  updated_at: string;
};

type PatientResponse = {
  patient: Patient;
};

type ErrorPayload = {
  error?:
    | string
    | {
        code?: string;
        message?: string;
      };
};

type FormState = {
  fullName: string;
  birthDate: string;
  cpf: string;
  phone: string;
  gender: "male" | "female" | "other" | "unknown" | "";
};

function toFormState(patient: Patient): FormState {
  return {
    fullName: patient.full_name ?? "",
    birthDate: patient.birth_date ?? "",
    cpf: patient.cpf ?? "",
    phone: patient.phone ?? "",
    gender: patient.gender ?? "",
  };
}

function getErrorMessage(
  payload: ErrorPayload | null,
  fallback: string,
): string {
  if (!payload?.error) {
    return fallback;
  }

  if (typeof payload.error === "string") {
    if (payload.error === "invalid_session") {
      return "Sessão inválida. Faça login novamente.";
    }
    if (payload.error === "database_not_configured") {
      return "Banco de dados indisponível no momento.";
    }
    return payload.error;
  }

  return payload.error.message || fallback;
}

export function PatientsProfileForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    birthDate: "",
    cpf: "",
    phone: "",
    gender: "",
  });

  const isDirty = useMemo(() => {
    if (!initialForm) {
      return false;
    }
    return JSON.stringify(initialForm) !== JSON.stringify(form);
  }, [form, initialForm]);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/patients/me");
        if (response.status === 401) {
          router.replace("/login?next=%2Fpatients");
          return;
        }
        const payload = (await response.json().catch(() => null)) as
          | PatientResponse
          | ErrorPayload
          | null;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              payload as ErrorPayload,
              "Não foi possível carregar os dados do paciente.",
            ),
          );
        }

        const patient = (payload as PatientResponse).patient;
        const nextForm = toFormState(patient);
        setForm(nextForm);
        setInitialForm(nextForm);
        setLastUpdatedAt(patient.updated_at);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar dados do paciente.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !isDirty) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/patients/me", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          birthDate: form.birthDate || null,
          cpf: form.cpf || null,
          phone: form.phone || null,
          gender: form.gender || null,
        }),
      });

      if (response.status === 401) {
        router.replace("/login?next=%2Fpatients");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | PatientResponse
        | ErrorPayload
        | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload as ErrorPayload,
            "Não foi possível salvar os dados.",
          ),
        );
      }

      const updatedPatient = (payload as PatientResponse).patient;
      const normalizedForm = toFormState(updatedPatient);
      setForm(normalizedForm);
      setInitialForm(normalizedForm);
      setLastUpdatedAt(updatedPatient.updated_at);
      setSuccess("Dados atualizados com sucesso.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Erro ao salvar dados.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-4xl surface-card rounded-[1.75rem] p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-primary shadow-[0_12px_30px_rgba(45,212,191,0.12)]">
            <UserRound className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
              Perfil
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Atualize seus dados
            </h1>
            <p className="text-sm leading-6 text-foreground/65">
              Você está editando os seus dados de paciente vinculados à conta autenticada.
            </p>
            <p className="mt-2 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Seu perfil de paciente
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-sm text-foreground/80">
          Este formulário altera apenas os dados do seu perfil de paciente.
          Use-o para manter informações pessoais atualizadas.
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-11 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-11 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-11 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-11 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground/80">
                  Nome completo
                </span>
                <Input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  className="h-12"
                  placeholder="Nome completo"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground/80">
                  Data de nascimento
                </span>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      birthDate: event.target.value,
                    }))
                  }
                  className="date-input-highlight h-12"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground/80">CPF</span>
                <Input
                  value={form.cpf}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, cpf: event.target.value }))
                  }
                  className="h-12"
                  placeholder="000.000.000-00"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground/80">
                  Telefone
                </span>
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="h-12"
                  placeholder="(00) 00000-0000"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground/80">Sexo</span>
                <Select
                  value={form.gender || "unspecified"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      gender:
                        value === "unspecified"
                          ? ""
                          : (value as FormState["gender"]),
                    }))
                  }
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Selecione o sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Não informado</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                    <SelectItem value="unknown">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="space-y-1">
                {lastUpdatedAt && (
                  <p className="text-xs text-foreground/55">
                    Última atualização:{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(lastUpdatedAt))}
                  </p>
                )}
                {error && <p className="text-sm text-rose-100">{error}</p>}
                {success && <p className="text-sm text-primary">{success}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12"
                disabled={isSaving || !isDirty}
              >
                <Save className="size-4" />
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
