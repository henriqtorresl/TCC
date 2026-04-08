import { KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatComposerProps = {
  value: string;
  isLoading: boolean;
  isHistoryLoading: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  error: string | null;
};

export function ChatComposer({
  value,
  isLoading,
  isHistoryLoading,
  onChange,
  onSend,
  error,
}: ChatComposerProps) {
  const isDisabled = isLoading || isHistoryLoading;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      onSend();
    }
  }

  return (
    <footer className="border-t border-zinc-800 px-4 py-4 md:px-6">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
        />
        <Button
          size="icon-lg"
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
          onClick={onSend}
          disabled={isDisabled || !value.trim()}
          aria-label="Enviar mensagem"
        >
          <SendHorizontal />
        </Button>
      </div>
      {error && <p className="pt-2 text-sm text-red-400">{error}</p>}
    </footer>
  );
}
