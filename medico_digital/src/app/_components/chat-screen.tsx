"use client";

import { SendHorizontal, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type ChatApiResponse = {
  reply: string;
};

export function ChatScreen() {
  const router = useRouter();
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSendMessage() {
    const text = textInput.trim();
    if (!text || isLoading) {
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
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro inesperado ao enviar mensagem."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex h-dvh w-full max-w-4xl flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4 md:px-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
            <Stethoscope className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold md:text-lg">Médico Virtual</h1>
            <p className="text-xs text-zinc-400 md:text-sm">
              Assistente de anamnese
            </p>
          </div>
        </header>

        <section className="flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-6">
          {messages.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
              Olá, sou seu assistente virtual. Como você está se sentindo hoje?
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
              disabled={isLoading}
            />
            <Button
              size="icon-lg"
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
              onClick={() => void handleSendMessage()}
              disabled={isLoading || !textInput.trim()}
              aria-label="Enviar mensagem"
            >
              <SendHorizontal />
            </Button>
          </div>
          {error && <p className="pt-2 text-sm text-red-400">{error}</p>}
        </footer>
      </div>
    </main>
  );
}
