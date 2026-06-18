import { KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatComposerProps = {
  value: string;
  isLoading: boolean;
  isHistoryLoading: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  error: string | null;
  statusMessage: string | null;
};

export function ChatComposer({
  value,
  isLoading,
  isHistoryLoading,
  onChange,
  onSend,
  error,
  statusMessage,
}: ChatComposerProps) {
  const isDisabled = isLoading || isHistoryLoading;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      onSend();
    }
  }

  return (
    <footer className="border-t border-zinc-800 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 sm:px-3">
        <Input
          type="text"
          placeholder="Digite sua mensagem..."
          className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm shadow-none outline-none placeholder:text-zinc-500 focus-visible:ring-0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
        />
        <Button
          size="icon-lg"
          className="size-9 bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
          onClick={onSend}
          disabled={isDisabled || !value.trim()}
          aria-label="Enviar mensagem"
        >
          <SendHorizontal />
        </Button>
      </div>
      {error && <p className="pt-2 text-sm text-red-400">{error}</p>}
      {statusMessage && <p className="pt-2 text-sm text-emerald-400">{statusMessage}</p>}
    </footer>
  );
}
