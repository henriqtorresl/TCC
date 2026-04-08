"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AttendancesPanel } from "@/app/_components/chat/attendances-panel";
import { ChatComposer } from "@/app/_components/chat/chat-composer";
import { ChatHeader } from "@/app/_components/chat/chat-header";
import { ChatMessages } from "@/app/_components/chat/chat-messages";
import {
  AttendanceListResponse,
  AttendanceMessagesResponse,
  AttendanceSummary,
  ChatApiResponse,
  ChatMessage,
  StartAttendanceResponse,
} from "@/app/_components/chat/types";

export function ChatScreen() {
  const router = useRouter();
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attendances, setAttendances] = useState<AttendanceSummary[]>([]);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    number | null
  >(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingAttendance, setIsStartingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeAttendanceId = useMemo(
    () =>
      attendances.find((attendance) => attendance.status === "active")?.id ??
      null,
    [attendances],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadAttendances = useCallback(
    async (preserveSelection = true) => {
      const response = await fetch("/api/attendances");
      if (response.status === 401) {
        router.replace("/login?next=%2F");
        return;
      }
      if (!response.ok) {
        throw new Error("Não foi possível carregar os atendimentos salvos.");
      }

      const data = (await response.json()) as AttendanceListResponse;
      setAttendances(data.attendances);

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
    },
    [router],
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
      return;
    }

    void (async () => {
      try {
        await loadAttendanceMessages(selectedAttendanceId);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erro ao carregar histórico.",
        );
      }
    })();
  }, [selectedAttendanceId, loadAttendanceMessages]);

  async function handleSendMessage() {
    const text = textInput.trim();
    if (!text || isLoading || isHistoryLoading) {
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
    if (isLoading || isStartingAttendance || isHistoryLoading) {
      return;
    }

    if (
      messages.length > 0 &&
      !window.confirm("Iniciar um novo atendimento e limpar o chat atual?")
    ) {
      return;
    }

    setError(null);
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
      await loadAttendances(false);
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

  return (
    <main className="min-h-dvh w-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-dvh w-full max-w-6xl">
        <AttendancesPanel
          attendances={attendances}
          selectedAttendanceId={selectedAttendanceId}
          onSelectAttendance={setSelectedAttendanceId}
        />

        <div className="flex w-full flex-col">
          <ChatHeader
            onStartNewAttendance={() => void handleStartNewAttendance()}
            isStartingAttendance={isStartingAttendance}
            disableNewAttendance={isLoading || isStartingAttendance || isHistoryLoading}
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
          />
        </div>
      </div>
    </main>
  );
}
