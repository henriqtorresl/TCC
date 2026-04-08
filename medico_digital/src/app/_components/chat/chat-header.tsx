import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  onStartNewAttendance: () => void;
  isStartingAttendance: boolean;
  disableNewAttendance: boolean;
};

export function ChatHeader({
  onStartNewAttendance,
  isStartingAttendance,
  disableNewAttendance,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4 md:px-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
        <Stethoscope className="size-5 text-emerald-400" />
      </div>
      <div>
        <h1 className="text-base font-semibold md:text-lg">Médico Virtual</h1>
        <p className="text-xs text-zinc-400 md:text-sm">Assistente de anamnese</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
          onClick={onStartNewAttendance}
          disabled={disableNewAttendance}
        >
          {isStartingAttendance ? "Iniciando..." : "Novo atendimento"}
        </Button>
      </div>
    </header>
  );
}
