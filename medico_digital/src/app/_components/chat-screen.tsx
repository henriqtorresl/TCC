"use client";

import { SendHorizontal, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  text: string;
};

type ChatApiResponse = {
  reply: string;
};

type AttendanceSummary = {
  id: number;
  title: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  last_message_at: string | null;
  message_count: string;
};

type AttendanceListResponse = {
  attendances: AttendanceSummary[];
};

type AttendanceMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type AttendanceMessagesResponse = {
  messages: AttendanceMessage[];
};

type StartAttendanceResponse = {
  conversationId: number;
};

function formatAttendanceLabel(attendance: AttendanceSummary): string {
  const date = new Date(attendance.started_at);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

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
        <aside className="hidden w-72 flex-col border-r border-zinc-800 bg-zinc-900/40 md:flex">
          <div className="border-b border-zinc-800 px-4 py-4">
            <h2 className="text-sm font-semibold text-zinc-200">
              Atendimentos
            </h2>
            <p className="text-xs text-zinc-400">Histórico por usuário</p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {attendances.length === 0 && (
              <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
                Nenhum atendimento salvo ainda.
              </p>
            )}
            {attendances.map((attendance) => (
              <button
                key={attendance.id}
                type="button"
                onClick={() => setSelectedAttendanceId(attendance.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  selectedAttendanceId === attendance.id
                    ? "border-emerald-500/50 bg-emerald-900/20"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <p className="text-sm font-medium text-zinc-200">
                  Atendimento #{attendance.id}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatAttendanceLabel(attendance)}
                </p>
                <p className="text-xs text-zinc-500">
                  {attendance.status === "active" ? "Ativo" : "Encerrado"} ·{" "}
                  {attendance.message_count} mensagens
                </p>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex w-full flex-col">
          <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4 md:px-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
              <Stethoscope className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold md:text-lg">
                Médico Virtual
              </h1>
              <p className="text-xs text-zinc-400 md:text-sm">
                Assistente de anamnese
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                onClick={() => void handleStartNewAttendance()}
                disabled={isLoading || isStartingAttendance || isHistoryLoading}
              >
                {isStartingAttendance ? "Iniciando..." : "Novo atendimento"}
              </Button>
            </div>
          </header>

          <div className="border-b border-zinc-800 px-4 py-3 md:hidden">
            <select
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none"
              value={selectedAttendanceId ?? ""}
              onChange={(event) =>
                setSelectedAttendanceId(Number(event.target.value))
              }
            >
              <option value="" disabled>
                Selecione um atendimento
              </option>
              {attendances.map((attendance) => (
                <option key={attendance.id} value={attendance.id}>
                  #{attendance.id} -{" "}
                  {attendance.status === "active" ? "Ativo" : "Encerrado"} -{" "}
                  {formatAttendanceLabel(attendance)}
                </option>
              ))}
            </select>
          </div>

          <section className="flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-6">
            {isHistoryLoading && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
                Carregando histórico do atendimento...
              </div>
            )}

            {!isHistoryLoading && messages.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
                Olá, sou seu assistente virtual. Como você está se sentindo
                hoje?
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-zinc-100 text-zinc-900"
                      : "border border-zinc-700 bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3">
                  <span className="size-2 animate-bounce rounded-full bg-zinc-100" />
                  <span className="size-2 animate-bounce rounded-full bg-zinc-100 [animation-delay:0.15s]" />
                  <span className="size-2 animate-bounce rounded-full bg-zinc-100 [animation-delay:0.3s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </section>

          <footer className="border-t border-zinc-800 px-4 py-4 md:px-6">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSendMessage();
                  }
                }}
                disabled={isLoading || isHistoryLoading}
              />
              <Button
                size="icon-lg"
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
                onClick={() => void handleSendMessage()}
                disabled={isLoading || isHistoryLoading || !textInput.trim()}
                aria-label="Enviar mensagem"
              >
                <SendHorizontal />
              </Button>
            </div>
            {error && <p className="pt-2 text-sm text-red-400">{error}</p>}
          </footer>
        </div>
      </div>
    </main>
  );
}
