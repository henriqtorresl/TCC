"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AttendancesPanel } from "@/components/chat/attendances-panel";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import {
  AttendanceListResponse,
  AttendanceMessagesResponse,
  AttendanceSummary,
  ChatApiResponse,
  ChatMessage,
  ConversationNotReadyErrorResponse,
  FinalizeAttendanceResponse,
  ReportAvailabilityResponse,
  ReportGenerateResponse,
  ReportReadinessResponse,
  StartAttendanceResponse,
} from "@/components/chat/types";

export function ChatScreen() {
  const router = useRouter();
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attendances, setAttendances] = useState<AttendanceSummary[]>([]);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    number | null
  >(null);
  const [isAttendancesLoading, setIsAttendancesLoading] = useState(false);
  const [attendancesPage, setAttendancesPage] = useState(1);
  const [attendancesPageSize] = useState(5);
  const [attendancesTotal, setAttendancesTotal] = useState(0);
  const [attendancesTotalPages, setAttendancesTotalPages] = useState(1);
  const [dateFromFilterInput, setDateFromFilterInput] = useState("");
  const [dateToFilterInput, setDateToFilterInput] = useState("");
  const [dateFromFilterApplied, setDateFromFilterApplied] = useState("");
  const [dateToFilterApplied, setDateToFilterApplied] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [isFinalizingAttendance, setIsFinalizingAttendance] = useState(false);
  const [isResumingAttendance, setIsResumingAttendance] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [readinessIssue, setReadinessIssue] = useState<string | null>(null);
  const [readinessPreview, setReadinessPreview] =
    useState<ReportReadinessResponse | null>(null);
  const [downloadableReportId, setDownloadableReportId] = useState<number | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeAttendanceId = useMemo(
    () =>
      attendances.find((attendance) => attendance.status === "active")?.id ??
      null,
    [attendances],
  );

  const selectedAttendance = useMemo(
    () =>
      selectedAttendanceId
        ? attendances.find((attendance) => attendance.id === selectedAttendanceId) ??
          null
        : null,
    [attendances, selectedAttendanceId],
  );

  const readinessHint = useMemo(() => {
    if (readinessIssue) {
      return readinessIssue;
    }

    if (!selectedAttendance || !readinessPreview) {
      return null;
    }

    const score = readinessPreview.readiness.score;
    const required = readinessPreview.readiness.required_score;
    const missing = readinessPreview.readiness.missing_criteria;

    if (missing.length === 0) {
      return `Prontidão do relatório: ${score}/${required} (completo).`;
    }

    const translatedMissing = missing.map(getMissingCriteriaLabel).join(", ");
    return `Prontidão do relatório: ${score}/${required}. Faltam: ${translatedMissing}.`;
  }, [selectedAttendance, readinessIssue, readinessPreview]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadAttendances = useCallback(
    async (
      preserveSelection = true,
      options?: {
        page?: number;
        dateFrom?: string;
        dateTo?: string;
      },
    ) => {
      setIsAttendancesLoading(true);
      try {
        const currentPage = options?.page ?? attendancesPage;
        const currentDateFrom = options?.dateFrom ?? dateFromFilterApplied;
        const currentDateTo = options?.dateTo ?? dateToFilterApplied;

        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(attendancesPageSize),
        });

        if (currentDateFrom) {
          params.set("dateFrom", currentDateFrom);
        }
        if (currentDateTo) {
          params.set("dateTo", currentDateTo);
        }

        const response = await fetch(`/api/attendances?${params.toString()}`);
        if (response.status === 401) {
          router.replace("/login?next=%2F");
          return;
        }
        if (!response.ok) {
          throw new Error("Não foi possível carregar os atendimentos salvos.");
        }

        const data = (await response.json()) as AttendanceListResponse;
        setAttendances(data.attendances);
        setAttendancesPage(data.pagination.page);
        setAttendancesTotal(data.pagination.total);
        setAttendancesTotalPages(data.pagination.totalPages);

        if (data.attendances.length === 0) {
          setSelectedAttendanceId(null);
          setMessages([]);
          return;
        }

        setSelectedAttendanceId((currentId) => {
          if (
            preserveSelection &&
            currentId &&
            data.attendances.some((attendance) => attendance.id === currentId)
          ) {
            return currentId;
          }

          const activeAttendance = data.attendances.find(
            (attendance) => attendance.status === "active",
          );
          return activeAttendance?.id ?? data.attendances[0].id;
        });
      } finally {
        setIsAttendancesLoading(false);
      }
    },
    [router, attendancesPage, attendancesPageSize, dateFromFilterApplied, dateToFilterApplied],
  );

  const loadAttendanceMessages = useCallback(
    async (attendanceId: number) => {
      setIsHistoryLoading(true);
      try {
        const response = await fetch(
          `/api/attendances/${attendanceId}/messages`,
        );
        if (response.status === 401) {
          router.replace("/login?next=%2F");
          return;
        }
        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar as mensagens do atendimento.",
          );
        }

        const data = (await response.json()) as AttendanceMessagesResponse;
        const mappedMessages = data.messages
          .filter(
            (message) =>
              message.role === "user" || message.role === "assistant",
          )
          .map((message) => ({ role: message.role, text: message.content }));
        setMessages(mappedMessages);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [router],
  );

  const loadReadinessPreview = useCallback(
    async (attendanceId: number) => {
      const response = await fetch(
        `/api/reports/readiness?conversationId=${attendanceId}`,
      );

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return null;
      }

      if (response.status === 400 || response.status === 404) {
        setReadinessPreview(null);
        if (response.status === 400) {
          const payload = (await response.json()) as { error?: string };
          if (payload.error === "conversation_without_messages") {
            setReadinessIssue(
              "Prontidão do relatório: envie mais informações no chat para avaliar completude.",
            );
            return null;
          }
        }
        setReadinessIssue(null);
        return null;
      }

      if (!response.ok) {
        throw new Error("Não foi possível verificar a prontidão do relatório.");
      }

      const payload = (await response.json()) as ReportReadinessResponse;
      setReadinessPreview(payload);
      setReadinessIssue(null);
      return payload;
    },
    [router],
  );

  const loadReportAvailability = useCallback(
    async (attendanceId: number) => {
      const response = await fetch(
        `/api/reports/availability?conversationId=${attendanceId}`,
      );

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return null;
      }

      if (response.status === 400 || response.status === 404) {
        setDownloadableReportId(null);
        return null;
      }

      if (!response.ok) {
        throw new Error("Não foi possível verificar disponibilidade do relatório.");
      }

      const payload = (await response.json()) as ReportAvailabilityResponse;
      setDownloadableReportId(payload.canDownload ? payload.reportId : null);
      return payload;
    },
    [router],
  );

  useEffect(() => {
    void (async () => {
      try {
        await loadAttendances(false);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erro ao carregar atendimentos.",
        );
      }
    })();
  }, [loadAttendances]);

  useEffect(() => {
    if (!selectedAttendanceId) {
      setReadinessPreview(null);
      setReadinessIssue(null);
      setDownloadableReportId(null);
      return;
    }

    void (async () => {
      try {
        await loadAttendanceMessages(selectedAttendanceId);
        await loadReadinessPreview(selectedAttendanceId);
        await loadReportAvailability(selectedAttendanceId);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erro ao carregar histórico.",
        );
      }
    })();
  }, [
    selectedAttendanceId,
    loadAttendanceMessages,
    loadReadinessPreview,
    loadReportAvailability,
  ]);

  async function handleSendMessage() {
    const text = textInput.trim();
    if (
      !text ||
      isLoading ||
      isHistoryLoading ||
      isFinalizingAttendance ||
      isResumingAttendance ||
      isGeneratingReport
    ) {
      return;
    }

    if (
      selectedAttendanceId &&
      activeAttendanceId &&
      selectedAttendanceId !== activeAttendanceId
    ) {
      setError(
        "Este atendimento já foi encerrado. Selecione o ativo ou inicie um novo atendimento.",
      );
      return;
    }

    setTextInput("");
    setError(null);
    setStatusMessage(null);
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
        }),
      });

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível enviar a mensagem.");
      }

      const data = (await response.json()) as ChatApiResponse;
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      await loadAttendances(true);
      if (selectedAttendanceId) {
        await loadReadinessPreview(selectedAttendanceId);
        await loadReportAvailability(selectedAttendanceId);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao enviar mensagem.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartNewAttendance() {
    if (
      isLoading ||
      isStartingAttendance ||
      isHistoryLoading ||
      isFinalizingAttendance ||
      isResumingAttendance ||
      isGeneratingReport
    ) {
      return;
    }

    if (
      messages.length > 0 &&
      !window.confirm("Iniciar um novo atendimento e limpar o chat atual?")
    ) {
      return;
    }

    setError(null);
    setStatusMessage(null);
    setIsStartingAttendance(true);

    try {
      const response = await fetch("/api/message/attendance/start", {
        method: "POST",
      });

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível iniciar um novo atendimento.");
      }

      const data = (await response.json()) as StartAttendanceResponse;
      setMessages([]);
      setTextInput("");
      setSelectedAttendanceId(data.conversationId);
      setReadinessPreview(null);
      setReadinessIssue(null);
      setDownloadableReportId(null);
      await loadAttendances(false, { page: 1 });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao iniciar novo atendimento.",
      );
    } finally {
      setIsStartingAttendance(false);
    }
  }

  function applyDateFilter() {
    setDateFromFilterApplied(dateFromFilterInput);
    setDateToFilterApplied(dateToFilterInput);
    void loadAttendances(false, {
      page: 1,
      dateFrom: dateFromFilterInput,
      dateTo: dateToFilterInput,
    });
  }

  function clearDateFilter() {
    setDateFromFilterInput("");
    setDateToFilterInput("");
    setDateFromFilterApplied("");
    setDateToFilterApplied("");
    void loadAttendances(false, { page: 1, dateFrom: "", dateTo: "" });
  }

  function goToPreviousPage() {
    if (attendancesPage <= 1) {
      return;
    }
    void loadAttendances(false, { page: attendancesPage - 1 });
  }

  function goToNextPage() {
    if (attendancesPage >= attendancesTotalPages) {
      return;
    }
    void loadAttendances(false, { page: attendancesPage + 1 });
  }

  async function generateReport(
    attendanceId: number,
    allowIncomplete: boolean,
  ): Promise<Response> {
    return fetch("/api/reports/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        conversationId: attendanceId,
        allowIncomplete,
      }),
    });
  }

  async function downloadReportPdf(reportId: number): Promise<void> {
    const printUrl = `/reports/${reportId}/print`;
    window.open(printUrl, "_blank", "noopener,noreferrer");
  }

  async function finalizeAttendance(attendanceId: number): Promise<Response> {
    return fetch(`/api/attendances/${attendanceId}/finalize`, {
      method: "POST",
    });
  }

  async function resumeAttendance(attendanceId: number): Promise<Response> {
    return fetch(`/api/attendances/${attendanceId}/resume`, {
      method: "POST",
    });
  }

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

  function formatMissingCriteria(missingCriteria: string[]): string {
    return missingCriteria.map(getMissingCriteriaLabel).join(", ");
  }

  async function ensureReadinessPreview(
    attendanceId: number,
  ): Promise<ReportReadinessResponse | null> {
    if (readinessPreview?.conversationId === attendanceId) {
      return readinessPreview;
    }

    return loadReadinessPreview(attendanceId);
  }

  async function handleFinalizeAttendance() {
    if (
      !selectedAttendance ||
      selectedAttendance.status !== "active" ||
      isFinalizingAttendance ||
      isLoading ||
      isHistoryLoading ||
      isGeneratingReport ||
      isStartingAttendance
    ) {
      return;
    }

    setError(null);
    setStatusMessage(null);
    setIsFinalizingAttendance(true);

    try {
      const readiness = await ensureReadinessPreview(selectedAttendance.id);
      if (readinessIssue) {
        const shouldFinalizeWithoutData = window.confirm(
          `${readinessIssue} Deseja finalizar mesmo assim?`,
        );
        if (!shouldFinalizeWithoutData) {
          setError(
            "Atendimento mantido em aberto para continuar a coleta de informações.",
          );
          return;
        }
      }

      if (readiness && !readiness.readiness.is_ready) {
        const shouldFinalize = window.confirm(
          `Ainda faltam informações para um relatório completo: ${formatMissingCriteria(
            readiness.readiness.missing_criteria,
          )}. Deseja finalizar o atendimento mesmo assim?`,
        );

        if (!shouldFinalize) {
          setError(
            "Atendimento mantido em aberto. Continue a conversa para completar os tópicos pendentes.",
          );
          return;
        }
      }

      const response = await finalizeAttendance(selectedAttendance.id);

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return;
      }

      if (response.status === 409) {
        await loadAttendances(true);
        throw new Error("Este atendimento já foi finalizado.");
      }

      if (!response.ok) {
        throw new Error("Não foi possível finalizar o atendimento.");
      }

      const payload = (await response.json()) as FinalizeAttendanceResponse;
      await loadAttendances(true);
      await loadReadinessPreview(payload.attendanceId);
      await loadReportAvailability(payload.attendanceId);
      setStatusMessage(
        "Atendimento finalizado. Agora você já pode gerar o relatório.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao finalizar atendimento.",
      );
    } finally {
      setIsFinalizingAttendance(false);
    }
  }

  async function handleResumeAttendance() {
    if (
      !selectedAttendance ||
      selectedAttendance.status === "active" ||
      isResumingAttendance ||
      isFinalizingAttendance ||
      isLoading ||
      isHistoryLoading ||
      isGeneratingReport ||
      isStartingAttendance
    ) {
      return;
    }

    setError(null);
    setStatusMessage(null);
    setIsResumingAttendance(true);

    try {
      const response = await resumeAttendance(selectedAttendance.id);

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível retomar o atendimento.");
      }

      const payload = (await response.json()) as FinalizeAttendanceResponse;
      await loadAttendances(true);
      await loadReadinessPreview(payload.attendanceId);
      setDownloadableReportId(null);
      setStatusMessage(
        "Atendimento retomado. Continue a anamnese e finalize quando estiver completo.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao retomar atendimento.",
      );
    } finally {
      setIsResumingAttendance(false);
    }
  }

  async function handleAttendanceAction() {
    if (!selectedAttendance) {
      return;
    }

    if (selectedAttendance.status === "active") {
      await handleFinalizeAttendance();
      return;
    }

    await handleResumeAttendance();
  }

  async function handleGenerateReport() {
    if (
      !selectedAttendance ||
      isGeneratingReport ||
      isLoading ||
      isHistoryLoading ||
      isStartingAttendance ||
      isFinalizingAttendance ||
      isResumingAttendance
    ) {
      return;
    }

    if (selectedAttendance.status === "active") {
      setError(
        "Para gerar relatório, finalize o atendimento atual no botão \"Finalizar atendimento\".",
      );
      setStatusMessage(null);
      return;
    }

    if (downloadableReportId) {
      try {
        setError(null);
        setStatusMessage(null);
        setIsGeneratingReport(true);
        await downloadReportPdf(downloadableReportId);
        setStatusMessage(`Relatório #${downloadableReportId} baixado com sucesso.`);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erro inesperado ao baixar relatório.",
        );
      } finally {
        setIsGeneratingReport(false);
      }
      return;
    }

    setError(null);
    setStatusMessage(null);
    setIsGeneratingReport(true);

    try {
      const readiness = await ensureReadinessPreview(selectedAttendance.id);
      let allowIncomplete = false;

      if (readinessIssue) {
        throw new Error(
          "Ainda não há informações suficientes no atendimento para gerar relatório.",
        );
      }

      if (readiness && !readiness.readiness.is_ready) {
        const shouldGenerateIncomplete = window.confirm(
          `O relatório ainda está incompleto. Faltam: ${formatMissingCriteria(
            readiness.readiness.missing_criteria,
          )}. Deseja gerar mesmo assim?`,
        );

        if (!shouldGenerateIncomplete) {
          setError(
            "Relatório não gerado. Complete os tópicos pendentes para exportar com completude.",
          );
          return;
        }

        allowIncomplete = true;
      }

      const response = await generateReport(selectedAttendance.id, allowIncomplete);

      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return;
      }

      if (response.ok) {
        const payload = (await response.json()) as ReportGenerateResponse;
        const score = payload.metadata?.readiness?.score;
        const required = payload.metadata?.readiness?.required_score;
        setDownloadableReportId(payload.id);

        setStatusMessage(
          score && required
            ? `Relatório #${payload.id} gerado com sucesso (${score}/${required}).`
            : `Relatório #${payload.id} gerado com sucesso.`,
        );
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
        const missingCriteria = payload.details?.missingCriteria ?? [];
        const missingLabels = missingCriteria.map(getMissingCriteriaLabel);
        const shouldGenerateIncomplete = window.confirm(
          `Ainda faltam informações para completar a anamnese: ${missingLabels.join(
            ", ",
          )}. Deseja gerar o relatório incompleto mesmo assim?`,
        );

        if (!shouldGenerateIncomplete) {
          setError(
            "Relatório não gerado. Complete os tópicos pendentes para exportar com completude.",
          );
          return;
        }

        const fallbackResponse = await generateReport(selectedAttendance.id, true);
        if (fallbackResponse.status === 401) {
          router.replace("/login?next=%2F");
          return;
        }
        if (!fallbackResponse.ok) {
          throw new Error("Não foi possível gerar o relatório incompleto.");
        }

        const fallbackPayload =
          (await fallbackResponse.json()) as ReportGenerateResponse;
        setDownloadableReportId(fallbackPayload.id);
        setStatusMessage(
          `Relatório #${fallbackPayload.id} (incompleto) gerado com sucesso.`,
        );
        return;
      }

      if ("error" in payload && typeof payload.error === "string") {
        if (payload.error === "conversation_not_completed") {
          throw new Error(
            "Este atendimento ainda está ativo. Encerre-o antes de gerar o relatório.",
          );
        }

        throw new Error(payload.error);
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
    <main className="h-full min-h-0 w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-6xl min-w-0 min-h-0 flex-col md:flex-row">
        <AttendancesPanel
          attendances={attendances}
          selectedAttendanceId={selectedAttendanceId}
          onSelectAttendance={setSelectedAttendanceId}
          isLoading={isAttendancesLoading}
          page={attendancesPage}
          totalPages={attendancesTotalPages}
          totalAttendances={attendancesTotal}
          dateFrom={dateFromFilterInput}
          dateTo={dateToFilterInput}
          onDateFromChange={setDateFromFilterInput}
          onDateToChange={setDateToFilterInput}
          onApplyDateFilter={applyDateFilter}
          onClearDateFilter={clearDateFilter}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />

        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <ChatHeader
            onStartNewAttendance={() => void handleStartNewAttendance()}
            onAttendanceAction={() => void handleAttendanceAction()}
            onGenerateReport={() => void handleGenerateReport()}
            isStartingAttendance={isStartingAttendance}
            isAttendanceActionLoading={
              isFinalizingAttendance || isResumingAttendance
            }
            isGeneratingReport={isGeneratingReport}
            disableNewAttendance={
              isLoading ||
              isStartingAttendance ||
              isHistoryLoading ||
              isGeneratingReport ||
              isFinalizingAttendance ||
              isResumingAttendance
            }
            disableAttendanceAction={
              !selectedAttendance ||
              isLoading ||
              isHistoryLoading ||
              isStartingAttendance ||
              isGeneratingReport ||
              isFinalizingAttendance ||
              isResumingAttendance
            }
            attendanceActionLabel={
              selectedAttendance?.status === "active"
                ? "Finalizar atendimento"
                : "Retomar atendimento"
            }
            disableGenerateReport={
              !selectedAttendance ||
              isLoading ||
              isHistoryLoading ||
              isStartingAttendance ||
              isGeneratingReport ||
              isFinalizingAttendance ||
              isResumingAttendance
            }
            reportActionLabel={
              downloadableReportId ? "Baixar relatório" : "Gerar relatório"
            }
            readinessHint={readinessHint}
          />
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isHistoryLoading={isHistoryLoading}
            messagesEndRef={messagesEndRef}
          />
          <ChatComposer
            value={textInput}
            onChange={setTextInput}
            onSend={() => void handleSendMessage()}
            isLoading={isLoading}
            isHistoryLoading={isHistoryLoading}
            error={error}
            statusMessage={statusMessage}
          />
        </div>
      </div>
    </main>
  );
}
