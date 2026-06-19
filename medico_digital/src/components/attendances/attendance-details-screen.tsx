"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Download,
  FileText,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AttendanceDetailsResponse,
  AttendanceMessage,
  AttendanceMessagesResponse,
  ConversationNotReadyErrorResponse,
  FinalizeAttendanceResponse,
  ReportAvailabilityResponse,
  ReportGenerateResponse,
  ReportReadinessResponse,
} from "@/components/chat/types";
import {
  formatAttendanceRelativeTime,
  getAttendanceStatusLabel,
} from "@/components/chat/attendance-utils";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";

type AttendanceDetailsScreenProps = {
  attendanceId: number;
};

function getMissingCriteriaLabel(key: string): string {
  const labels: Record<string, string> = {
    queixa_principal: "queixa principal",
    inicio_duracao: "início e duração",
    evolucao: "evolução",
    fatores_melhora_piora: "fatores de melhora/piora",
    sintomas_associados: "sintomas associados",
    antecedentes: "antecedentes",
    medicacoes_alergias: "medicações e alergias",
    habitos_contexto: "hábitos e contexto",
  };

  return labels[key] ?? key;
}

export function AttendanceDetailsScreen({
  attendanceId,
}: AttendanceDetailsScreenProps) {
  const router = useRouter();
  const { requestConfirmation, confirmationDialog } = useConfirmationDialog();
  const [attendance, setAttendance] = useState<
    AttendanceDetailsResponse["attendance"] | null
  >(null);
  const [messages, setMessages] = useState<AttendanceMessage[]>([]);
  const [readinessPreview, setReadinessPreview] =
    useState<ReportReadinessResponse | null>(null);
  const [downloadableReportId, setDownloadableReportId] = useState<
    number | null
  >(null);
  const [readinessIssue, setReadinessIssue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizingAttendance, setIsFinalizingAttendance] = useState(false);
  const [isResumingAttendance, setIsResumingAttendance] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const readinessHint = useMemo(() => {
    if (readinessIssue) {
      return readinessIssue;
    }

    if (!readinessPreview) {
      return null;
    }

    const score = readinessPreview.readiness.score;
    const required = readinessPreview.readiness.required_score;
    const missing = readinessPreview.readiness.missing_criteria;

    if (missing.length === 0) {
      return `Prontidão do relatório: ${score}/${required} (completo).`;
    }

    return `Prontidão do relatório: ${score}/${required}. Faltam: ${missing
      .map(getMissingCriteriaLabel)
      .join(", ")}.`;
  }, [readinessIssue, readinessPreview]);

  useEffect(() => {
    async function loadPageData() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          attendanceResponse,
          messagesResponse,
          readinessResponse,
          availabilityResponse,
        ] = await Promise.all([
          fetch(`/api/attendances/${attendanceId}`),
          fetch(`/api/attendances/${attendanceId}/messages`),
          fetch(`/api/reports/readiness?conversationId=${attendanceId}`),
          fetch(`/api/reports/availability?conversationId=${attendanceId}`),
        ]);

        if (
          attendanceResponse.status === 401 ||
          messagesResponse.status === 401 ||
          readinessResponse.status === 401 ||
          availabilityResponse.status === 401
        ) {
          router.replace(
            `/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`,
          );
          return;
        }

        if (!attendanceResponse.ok) {
          throw new Error(
            "Não foi possível carregar os detalhes do atendimento.",
          );
        }
        if (!messagesResponse.ok) {
          throw new Error(
            "Não foi possível carregar o histórico do atendimento.",
          );
        }

        const attendancePayload =
          (await attendanceResponse.json()) as AttendanceDetailsResponse;
        const messagesPayload =
          (await messagesResponse.json()) as AttendanceMessagesResponse;

        setAttendance(attendancePayload.attendance);
        setMessages(messagesPayload.messages);

        if (readinessResponse.status === 400) {
          const payload = (await readinessResponse.json()) as {
            error?: string;
          };
          if (payload.error === "conversation_without_messages") {
            setReadinessIssue(
              "Prontidão do relatório: envie mais informações no chat para avaliar completude.",
            );
          } else {
            setReadinessIssue(null);
          }
          setReadinessPreview(null);
        } else if (readinessResponse.ok) {
          const payload =
            (await readinessResponse.json()) as ReportReadinessResponse;
          setReadinessPreview(payload);
          setReadinessIssue(null);
        }

        if (availabilityResponse.ok) {
          const payload =
            (await availabilityResponse.json()) as ReportAvailabilityResponse;
          setDownloadableReportId(
            payload.canDownload ? payload.reportId : null,
          );
        } else {
          setDownloadableReportId(null);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erro inesperado ao carregar detalhes do atendimento.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPageData();
  }, [attendanceId, router]);

  async function refreshAfterMutation(nextStatusMessage?: string) {
    setStatusMessage(nextStatusMessage ?? null);
    setError(null);

    const [
      attendanceResponse,
      messagesResponse,
      readinessResponse,
      availabilityResponse,
    ] = await Promise.all([
      fetch(`/api/attendances/${attendanceId}`),
      fetch(`/api/attendances/${attendanceId}/messages`),
      fetch(`/api/reports/readiness?conversationId=${attendanceId}`),
      fetch(`/api/reports/availability?conversationId=${attendanceId}`),
    ]);

    if (
      attendanceResponse.status === 401 ||
      messagesResponse.status === 401 ||
      readinessResponse.status === 401 ||
      availabilityResponse.status === 401
    ) {
      router.replace(
        `/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`,
      );
      return;
    }

    if (attendanceResponse.ok) {
      const payload =
        (await attendanceResponse.json()) as AttendanceDetailsResponse;
      setAttendance(payload.attendance);
    }

    if (messagesResponse.ok) {
      const payload =
        (await messagesResponse.json()) as AttendanceMessagesResponse;
      setMessages(payload.messages);
    }

    if (readinessResponse.ok) {
      const payload =
        (await readinessResponse.json()) as ReportReadinessResponse;
      setReadinessPreview(payload);
      setReadinessIssue(null);
    } else if (readinessResponse.status === 400) {
      const payload = (await readinessResponse.json()) as { error?: string };
      if (payload.error === "conversation_without_messages") {
        setReadinessIssue(
          "Prontidão do relatório: envie mais informações no chat para avaliar completude.",
        );
      } else {
        setReadinessIssue(null);
      }
      setReadinessPreview(null);
    }

    if (availabilityResponse.ok) {
      const payload =
        (await availabilityResponse.json()) as ReportAvailabilityResponse;
      setDownloadableReportId(payload.canDownload ? payload.reportId : null);
    } else {
      setDownloadableReportId(null);
    }
  }

  async function handleAttendanceAction() {
    if (!attendance) {
      return;
    }

    setError(null);
    setStatusMessage(null);

    try {
      if (attendance.status === "active") {
        setIsFinalizingAttendance(true);
        const response = await fetch(
          `/api/attendances/${attendanceId}/finalize`,
          {
            method: "POST",
          },
        );

        if (response.status === 401) {
          router.replace(
            `/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error("Não foi possível finalizar o atendimento.");
        }

        const payload = (await response.json()) as FinalizeAttendanceResponse;
        await refreshAfterMutation(
          `Atendimento #${payload.attendanceId} finalizado com sucesso.`,
        );
        return;
      }

      setIsResumingAttendance(true);
      const response = await fetch(`/api/attendances/${attendanceId}/resume`, {
        method: "POST",
      });

      if (response.status === 401) {
        router.replace(
          `/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível retomar o atendimento.");
      }

      const payload = (await response.json()) as FinalizeAttendanceResponse;
      await refreshAfterMutation(
        `Atendimento #${payload.attendanceId} retomado com sucesso.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao atualizar atendimento.",
      );
    } finally {
      setIsFinalizingAttendance(false);
      setIsResumingAttendance(false);
    }
  }

  async function downloadReportPdf(reportId: number): Promise<void> {
    const printUrl = `/reports/${reportId}/print`;
    window.open(printUrl, "_blank", "noopener,noreferrer");
  }

  async function handleGenerateReport() {
    setError(null);
    setStatusMessage(null);
    setIsGeneratingReport(true);

    try {
      if (downloadableReportId) {
        await downloadReportPdf(downloadableReportId);
        setStatusMessage(
          `Relatório #${downloadableReportId} baixado com sucesso.`,
        );
        return;
      }

      let allowIncomplete = false;
      if (readinessIssue) {
        throw new Error(
          "Ainda não há informações suficientes para gerar relatório.",
        );
      }

      if (readinessPreview && !readinessPreview.readiness.is_ready) {
        const shouldGenerateIncomplete = await requestConfirmation({
          title: "Gerar relatório incompleto",
          description: `O relatório ainda está incompleto. Faltam: ${readinessPreview.readiness.missing_criteria
            .map(getMissingCriteriaLabel)
            .join(", ")}. Deseja gerar mesmo assim?`,
          confirmLabel: "Gerar assim mesmo",
          cancelLabel: "Cancelar",
        });

        if (!shouldGenerateIncomplete) {
          setError(
            "Relatório não gerado. Complete os tópicos pendentes primeiro.",
          );
          return;
        }

        allowIncomplete = true;
      }

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: attendanceId,
          allowIncomplete,
        }),
      });

      if (response.status === 401) {
        router.replace(
          `/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`,
        );
        return;
      }

      if (response.ok) {
        const payload = (await response.json()) as ReportGenerateResponse;
        setDownloadableReportId(payload.id);
        setStatusMessage(`Relatório #${payload.id} gerado com sucesso.`);
        return;
      }

      const payload = (await response.json()) as
        | { error?: string }
        | ConversationNotReadyErrorResponse;

      if (
        response.status === 400 &&
        "error" in payload &&
        payload.error === "conversation_not_ready" &&
        "details" in payload
      ) {
        const shouldGenerateIncomplete = await requestConfirmation({
          title: "Gerar relatório incompleto",
          description: `Ainda faltam informações: ${payload.details.missingCriteria
            .map(getMissingCriteriaLabel)
            .join(", ")}. Deseja gerar incompleto?`,
          confirmLabel: "Gerar incompleto",
          cancelLabel: "Cancelar",
        });

        if (!shouldGenerateIncomplete) {
          setError("Relatório não gerado.");
          return;
        }

        const fallbackResponse = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversationId: attendanceId,
            allowIncomplete: true,
          }),
        });

        if (!fallbackResponse.ok) {
          throw new Error("Não foi possível gerar relatório incompleto.");
        }

        const fallbackPayload =
          (await fallbackResponse.json()) as ReportGenerateResponse;
        setDownloadableReportId(fallbackPayload.id);
        setStatusMessage(
          `Relatório #${fallbackPayload.id} (incompleto) gerado com sucesso.`,
        );
        return;
      }

      throw new Error("Não foi possível gerar o relatório.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao gerar relatório.",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <main className="relative min-h-dvh px-4 py-6 text-foreground md:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_26%)]" />
      <div className="relative mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="border-white/10 bg-white/5 text-foreground hover:bg-white/10"
          >
            <Link href="/chat">
              <ArrowLeft className="size-4" />
              Voltar ao chat
            </Link>
          </Button>
        </div>

        <section className="surface-card rounded-[1.75rem] p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-foreground/55">
                Detalhes do atendimento
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {attendance ? `Atendimento #${attendance.id}` : "Carregando..."}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
                onClick={() => void handleAttendanceAction()}
                disabled={
                  !attendance ||
                  isFinalizingAttendance ||
                  isResumingAttendance ||
                  isLoading
                }
              >
                {attendance?.status === "active"
                  ? isFinalizingAttendance
                    ? "Finalizando..."
                    : "Finalizar atendimento"
                  : isResumingAttendance
                    ? "Retomando..."
                    : "Retomar atendimento"}
              </Button>
              <Button
                variant="outline"
                className="border-primary/20 bg-primary/12 text-primary hover:bg-primary/16"
                onClick={() => void handleGenerateReport()}
                disabled={!attendance || isGeneratingReport || isLoading}
                title={readinessHint ?? undefined}
              >
                {isGeneratingReport ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : downloadableReportId ? (
                  <Download className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
                {isGeneratingReport ? (
                  <span className="inline-block h-4 w-28 animate-pulse rounded bg-white/15" />
                ) : downloadableReportId ? (
                  "Baixar relatório"
                ) : (
                  "Gerar relatório"
                )}
              </Button>
              <Button
                asChild
                className="border-white/10 bg-white/5 text-foreground hover:bg-white/10"
              >
                <Link href="/chat">
                  <Stethoscope className="size-4" />
                  Abrir no chat
                </Link>
              </Button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          {statusMessage && (
            <p className="mt-4 text-sm text-primary">{statusMessage}</p>
          )}

          {attendance && (
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-foreground/55">Status</p>
                <p className="mt-1 font-medium text-foreground">
                  {getAttendanceStatusLabel(attendance.status)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-foreground/55">Mensagens</p>
                <p className="mt-1 font-medium text-foreground">
                  {attendance.message_count}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-foreground/55">Início</p>
                <p className="mt-1 font-medium text-foreground">
                  {new Date(attendance.started_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-foreground/55">Última atividade</p>
                <p className="mt-1 inline-flex items-center gap-2 font-medium text-foreground">
                  <Clock3 className="size-3.5 text-foreground/45" />
                  {formatAttendanceRelativeTime(attendance.last_message_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 md:col-span-2">
                <p className="text-foreground/55">Encerramento</p>
                <p className="mt-1 font-medium text-foreground">
                  {attendance.ended_at
                    ? new Date(attendance.ended_at).toLocaleString("pt-BR")
                    : "Em andamento"}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="surface-card rounded-[1.75rem] p-4 md:p-6">
          <h2 className="mb-3 text-base font-semibold tracking-tight">
            Histórico de mensagens
          </h2>
          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/70">
              Carregando histórico...
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-foreground/70">
              Este atendimento ainda não possui mensagens.
            </div>
          )}

          <div className="space-y-3">
            {messages
              .filter(
                (message) =>
                  message.role === "user" || message.role === "assistant",
              )
              .map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-white/10 bg-white/6 text-foreground"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="mt-1 text-[11px] opacity-70">
                      {new Date(message.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
      {confirmationDialog}
    </main>
  );
}
