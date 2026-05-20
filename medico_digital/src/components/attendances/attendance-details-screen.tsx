"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Download, FileText, Stethoscope } from "lucide-react";
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
import { formatAttendanceRelativeTime, getAttendanceStatusLabel } from "@/components/chat/attendance-utils";

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
  const [attendance, setAttendance] = useState<AttendanceDetailsResponse["attendance"] | null>(null);
  const [messages, setMessages] = useState<AttendanceMessage[]>([]);
  const [readinessPreview, setReadinessPreview] = useState<ReportReadinessResponse | null>(null);
  const [downloadableReportId, setDownloadableReportId] = useState<number | null>(null);
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
        const [attendanceResponse, messagesResponse, readinessResponse, availabilityResponse] =
          await Promise.all([
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
          router.replace(`/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`);
          return;
        }

        if (!attendanceResponse.ok) {
          throw new Error("Não foi possível carregar os detalhes do atendimento.");
        }
        if (!messagesResponse.ok) {
          throw new Error("Não foi possível carregar o histórico do atendimento.");
        }

        const attendancePayload = (await attendanceResponse.json()) as AttendanceDetailsResponse;
        const messagesPayload = (await messagesResponse.json()) as AttendanceMessagesResponse;

        setAttendance(attendancePayload.attendance);
        setMessages(messagesPayload.messages);

        if (readinessResponse.status === 400) {
          const payload = (await readinessResponse.json()) as { error?: string };
          if (payload.error === "conversation_without_messages") {
            setReadinessIssue(
              "Prontidão do relatório: envie mais informações no chat para avaliar completude.",
            );
          } else {
            setReadinessIssue(null);
          }
          setReadinessPreview(null);
        } else if (readinessResponse.ok) {
          const payload = (await readinessResponse.json()) as ReportReadinessResponse;
          setReadinessPreview(payload);
          setReadinessIssue(null);
        }

        if (availabilityResponse.ok) {
          const payload = (await availabilityResponse.json()) as ReportAvailabilityResponse;
          setDownloadableReportId(payload.canDownload ? payload.reportId : null);
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

    const [attendanceResponse, messagesResponse, readinessResponse, availabilityResponse] =
      await Promise.all([
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
      router.replace(`/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`);
      return;
    }

    if (attendanceResponse.ok) {
      const payload = (await attendanceResponse.json()) as AttendanceDetailsResponse;
      setAttendance(payload.attendance);
    }

    if (messagesResponse.ok) {
      const payload = (await messagesResponse.json()) as AttendanceMessagesResponse;
      setMessages(payload.messages);
    }

    if (readinessResponse.ok) {
      const payload = (await readinessResponse.json()) as ReportReadinessResponse;
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
      const payload = (await availabilityResponse.json()) as ReportAvailabilityResponse;
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
        const response = await fetch(`/api/attendances/${attendanceId}/finalize`, {
          method: "POST",
        });

        if (response.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`);
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
        router.replace(`/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`);
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível retomar o atendimento.");
      }

      const payload = (await response.json()) as FinalizeAttendanceResponse;
      await refreshAfterMutation(`Atendimento #${payload.attendanceId} retomado com sucesso.`);
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
    const response = await fetch(`/api/reports/${reportId}/download`);

    if (response.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`);
      return;
    }

    if (!response.ok) {
      throw new Error("Relatório gerado, mas não foi possível baixar o PDF.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-${reportId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateReport() {
    setError(null);
    setStatusMessage(null);
    setIsGeneratingReport(true);

    try {
      if (downloadableReportId) {
        await downloadReportPdf(downloadableReportId);
        setStatusMessage(`Relatório #${downloadableReportId} baixado com sucesso.`);
        return;
      }

      let allowIncomplete = false;
      if (readinessIssue) {
        throw new Error("Ainda não há informações suficientes para gerar relatório.");
      }

      if (readinessPreview && !readinessPreview.readiness.is_ready) {
        const shouldGenerateIncomplete = window.confirm(
          `O relatório ainda está incompleto. Faltam: ${readinessPreview.readiness.missing_criteria
            .map(getMissingCriteriaLabel)
            .join(", ")}. Deseja gerar mesmo assim?`,
        );

        if (!shouldGenerateIncomplete) {
          setError("Relatório não gerado. Complete os tópicos pendentes primeiro.");
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
        router.replace(`/login?next=${encodeURIComponent(`/attendances/${attendanceId}`)}`);
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
        const shouldGenerateIncomplete = window.confirm(
          `Ainda faltam informações: ${payload.details.missingCriteria
            .map(getMissingCriteriaLabel)
            .join(", ")}. Deseja gerar incompleto?`,
        );

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

        const fallbackPayload = (await fallbackResponse.json()) as ReportGenerateResponse;
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
    <main className="min-h-dvh bg-zinc-950 px-4 py-6 text-zinc-100 md:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100">
            <Link href="/chat">
              <ArrowLeft className="size-4" />
              Voltar ao chat
            </Link>
          </Button>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Detalhes do atendimento</p>
              <h1 className="text-xl font-semibold">
                {attendance ? `Atendimento #${attendance.id}` : "Carregando..."}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-rose-700/70 bg-rose-950/45 text-rose-100 hover:bg-rose-900/60"
                onClick={() => void handleAttendanceAction()}
                disabled={!attendance || isFinalizingAttendance || isResumingAttendance || isLoading}
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
                className="border-emerald-700/80 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-900/70"
                onClick={() => void handleGenerateReport()}
                disabled={!attendance || isGeneratingReport || isLoading}
                title={readinessHint ?? undefined}
              >
                {downloadableReportId ? <Download className="size-4" /> : <FileText className="size-4" />}
                {isGeneratingReport
                  ? "Processando..."
                  : downloadableReportId
                    ? "Baixar relatório"
                    : "Gerar relatório"}
              </Button>
              <Button asChild variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100">
                <Link href="/chat">
                  <Stethoscope className="size-4" />
                  Abrir no chat
                </Link>
              </Button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          {statusMessage && <p className="mt-4 text-sm text-emerald-400">{statusMessage}</p>}

          {attendance && (
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-zinc-400">Status</p>
                <p className="mt-1 font-medium">{getAttendanceStatusLabel(attendance.status)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-zinc-400">Mensagens</p>
                <p className="mt-1 font-medium">{attendance.message_count}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-zinc-400">Início</p>
                <p className="mt-1 font-medium">
                  {new Date(attendance.started_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-zinc-400">Última atividade</p>
                <p className="mt-1 inline-flex items-center gap-2 font-medium">
                  <Clock3 className="size-3.5 text-zinc-400" />
                  {formatAttendanceRelativeTime(attendance.last_message_at)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 md:col-span-2">
                <p className="text-zinc-400">Encerramento</p>
                <p className="mt-1 font-medium">
                  {attendance.ended_at
                    ? new Date(attendance.ended_at).toLocaleString("pt-BR")
                    : "Em andamento"}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:p-6">
          <h2 className="mb-3 text-base font-semibold">Histórico de mensagens</h2>
          {isLoading && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
              Carregando histórico...
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
              Este atendimento ainda não possui mensagens.
            </div>
          )}

          <div className="space-y-3">
            {messages
              .filter((message) => message.role === "user" || message.role === "assistant")
              .map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-zinc-100 text-zinc-900"
                        : "border border-zinc-700 bg-zinc-800 text-zinc-100"
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
    </main>
  );
}
