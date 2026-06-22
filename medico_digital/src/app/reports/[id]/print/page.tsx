"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReportDownloadDataResponse } from "@/components/chat/types";

function display(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Não informado";
  }
  return String(value);
}

export default function ReportPrintPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const reportId = routeParams?.id ?? "";
  const [data, setData] = useState<ReportDownloadDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      return;
    }

    void (async () => {
      setError(null);
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (response.status === 401) {
        router.replace(
          `/login?next=${encodeURIComponent(`/reports/${reportId}/print`)}`,
        );
        return;
      }
      if (!response.ok) {
        setError("Não foi possível carregar os dados do relatório.");
        return;
      }
      const payload = (await response.json()) as ReportDownloadDataResponse;
      setData(payload);
    })();
  }, [reportId, router]);

  const computed = useMemo(() => {
    if (!data) {
      return null;
    }

    const missingCriteriaMapper: Record<string, string> = {
      queixa_principal: "Queixa principal",
      inicio_duracao: "Início e duração",
      evolucao: "Evolução",
      fatores_melhora_piora: "Fatores de melhora/piora",
      sintomas_associados: "Sintomas associados",
      antecedentes: "Antecedentes",
      medicacoes_alergias: "Medicações e alergias",
      habitos_contexto: "Hábitos e contexto",
    };

    const metadata = data.report.metadata ?? {};
    const readiness = metadata.readiness ?? {};
    const sections = metadata.sections ?? {};
    const missingCriteria = Array.isArray(readiness.missing_criteria)
      ? readiness.missing_criteria.map((c) => missingCriteriaMapper[c] ?? c)
      : [];

    return {
      readiness,
      sections,
      missingCriteria,
    };
  }, [data]);

  if (error) {
    return <main className="p-6 text-sm text-rose-100">{error}</main>;
  }

  if (!data || !computed) {
    return (
      <main className="p-6 text-sm text-foreground/65">
        Carregando relatório...
      </main>
    );
  }

  const score =
    typeof computed.readiness.score === "number"
      ? computed.readiness.score
      : null;
  const requiredScore =
    typeof computed.readiness.required_score === "number"
      ? computed.readiness.required_score
      : null;
  const readinessOk = computed.readiness.is_ready === true;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_26%),linear-gradient(180deg,_#09111f_0%,_#0f172a_100%)] py-8 text-foreground print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hide { display: none !important; }
          .page { box-shadow: none !important; border: 0 !important; margin: 0 auto !important; }
        }
      `}</style>

      <div className="print-hide mx-auto mb-4 flex max-w-[920px] items-center justify-end gap-2 px-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-foreground shadow-[0_10px_24px_rgba(2,8,23,0.18)] hover:bg-white/10"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <section className="page mx-auto max-w-[920px] overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_28px_90px_rgba(2,8,23,0.25)]">
        <header className="bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#0b1220_100%)] px-7 py-7 text-white">
          <h1 className="mb-3 text-[30px] font-semibold leading-tight tracking-tight">
            Relatório de Anamnese
          </h1>
          <div className="grid gap-x-6 gap-y-2 text-[13px] text-white/78 md:grid-cols-2">
            <p>
              <strong className="font-semibold text-white">
                Relatório ID:
              </strong>{" "}
              {display(data.report.id)}
            </p>
            <p>
              <strong className="font-semibold text-white">
                Atendimento ID:
              </strong>{" "}
              {display(data.report.conversation_id || data.attendance.id)}
            </p>
            <p>
              <strong className="font-semibold text-white">Paciente:</strong>{" "}
              {display(data.patient.full_name)}
            </p>
            <p>
              <strong className="font-semibold text-white">Gerado em:</strong>{" "}
              {display(
                data.report.generated_at
                  ? new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(data.report.generated_at))
                  : "",
              )}
            </p>
            <p>
              <strong className="font-semibold text-white">
                Status do atendimento:
              </strong>{" "}
              {display(data.attendance.status)}
            </p>
            <p>
              <strong className="font-semibold text-white">
                Status do relatório:
              </strong>{" "}
              {display(data.report.status)}
            </p>
          </div>
        </header>

        <div className="space-y-6 px-7 py-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
              Completude da Anamnese
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              {score !== null && requiredScore !== null ? (
                <p className="mb-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      readinessOk
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {readinessOk ? "Completo" : "Incompleto"}
                  </span>
                  <span className="ml-2 text-sm font-semibold text-slate-800">
                    Score: {score}/{requiredScore}
                  </span>
                </p>
              ) : (
                <p className="text-sm">Completude não disponível.</p>
              )}

              {computed.missingCriteria.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Itens pendentes:
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                    {computed.missingCriteria.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
              Seções Clínicas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Queixa principal", computed.sections.queixa_principal],
                ["Início e duração", computed.sections.inicio_duracao],
                ["Evolução", computed.sections.evolucao],
                [
                  "Fatores de melhora/piora",
                  computed.sections.fatores_melhora_piora,
                ],
                ["Sintomas associados", computed.sections.sintomas_associados],
                ["Antecedentes", computed.sections.antecedentes],
                [
                  "Medicações e alergias",
                  computed.sections.medicacoes_alergias,
                ],
                ["Hábitos e contexto", computed.sections.habitos_contexto],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-800">
                    {display(value)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
              Resumo Consolidado
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {display(data.report.summary)}
              </p>
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-7 py-3 text-xs text-slate-500">
          Este documento representa triagem/anamnese e não substitui diagnóstico
          médico.
        </footer>
      </section>
    </main>
  );
}
