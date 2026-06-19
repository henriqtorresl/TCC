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
    <footer className="border-t border-white/10 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 rounded-[1.4rem] border border-white/10 bg-white/5 px-3 py-3 sm:px-4">
        <Input
          type="text"
          placeholder="Digite sua mensagem..."
          className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base shadow-none outline-none placeholder:text-foreground/40 focus-visible:ring-0 md:text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
        />
        <Button
          size="icon-lg"
          className="size-11 border border-white/10 bg-white/6 text-foreground hover:bg-white/10"
          onClick={onSend}
          disabled={isDisabled || !value.trim()}
          aria-label="Enviar mensagem"
        >
          <SendHorizontal />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/55">
        <p>Pressione Enter para enviar</p>
        {statusMessage && <p className="text-primary">{statusMessage}</p>}
      </div>
      {error && <p className="pt-2 text-sm text-rose-100">{error}</p>}
    </footer>
  );
}
