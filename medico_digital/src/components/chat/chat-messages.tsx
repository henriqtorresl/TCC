import { RefObject } from "react";
import { ChatMessage } from "@/components/chat/types";

type ChatMessagesProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export function ChatMessages({
  messages,
  isLoading,
  isHistoryLoading,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <section className="flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-6">
      {isHistoryLoading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          Carregando histórico do atendimento...
        </div>
      )}

      {!isHistoryLoading && messages.length === 0 && (
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
  );
}
