import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  onStartNewAttendance: () => void;
  onAttendanceAction: () => void;
  onGenerateReport: () => void;
  isStartingAttendance: boolean;
  isAttendanceActionLoading: boolean;
  isGeneratingReport: boolean;
  disableNewAttendance: boolean;
  disableAttendanceAction: boolean;
  attendanceActionLabel: string;
  disableGenerateReport: boolean;
  reportActionLabel: string;
  readinessHint: string | null;
};

export function ChatHeader({
  onStartNewAttendance,
  onAttendanceAction,
  onGenerateReport,
  isStartingAttendance,
  isAttendanceActionLoading,
  isGeneratingReport,
  disableNewAttendance,
  disableAttendanceAction,
  attendanceActionLabel,
  disableGenerateReport,
  reportActionLabel,
  readinessHint,
}: ChatHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-4 md:px-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
        <Stethoscope className="size-5 text-emerald-400" />
      </div>
      <div>
        <h1 className="text-base font-semibold md:text-lg">Médico Virtual</h1>
        <p className="text-xs text-zinc-400 md:text-sm">Assistente de anamnese</p>
      </div>
      <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
        <Button
          variant="outline"
          className="border-amber-700/70 bg-amber-950/40 text-amber-100 hover:bg-amber-900/55"
          onClick={onAttendanceAction}
          disabled={disableAttendanceAction}
        >
          {isAttendanceActionLoading ? "Processando..." : attendanceActionLabel}
        </Button>
        <Button
          variant="outline"
          className="border-emerald-700/70 bg-emerald-950/50 text-emerald-200 hover:bg-emerald-900/60"
          onClick={onGenerateReport}
          disabled={disableGenerateReport}
          title={readinessHint ?? undefined}
        >
          {isGeneratingReport ? "Processando..." : reportActionLabel}
        </Button>
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
