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
    <section className="scrollbar-slim min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      {isHistoryLoading && (
        <div className="px-1 text-sm text-foreground/70">
          Carregando histórico do atendimento...
        </div>
      )}

      {!isHistoryLoading && messages.length === 0 && (
        <div className="px-1 text-sm text-foreground/70">
          Olá, sou seu assistente clínico. Como você está se sentindo hoje?
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
            className={`max-w-[88%] break-words rounded-[1.35rem] px-4 py-3 text-sm leading-7 sm:max-w-[80%] ${
              message.role === "user"
                ? "border border-white/10 bg-white/6 text-foreground"
                : "border border-white/10 bg-white/6 text-foreground"
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 px-1 py-1">
            <span className="size-2 animate-bounce rounded-full bg-foreground/50" />
            <span className="size-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.15s]" />
            <span className="size-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.3s]" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </section>
  );
}
