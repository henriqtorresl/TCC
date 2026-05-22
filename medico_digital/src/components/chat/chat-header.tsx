import { ChevronDown, Stethoscope } from "lucide-react";
import { useState } from "react";
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
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-4 md:px-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800">
        <Stethoscope className="size-5 text-emerald-400" />
      </div>
      <div className="min-w-0">
        <h1 className="text-base font-semibold md:text-lg">Médico Virtual</h1>
        <p className="text-xs text-zinc-400 md:text-sm">
          Assistente de anamnese
        </p>
      </div>
      <div className="ml-auto lg:hidden">
        <Button
          type="button"
          size="icon"
          className="border-zinc-700 bg-zinc-900 text-zinc-100"
          onClick={() => setIsMobileActionsOpen((current) => !current)}
          aria-expanded={isMobileActionsOpen}
          aria-label="Mostrar ações do atendimento"
        >
          <ChevronDown
            className={`size-4 transition-transform ${
              isMobileActionsOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      <div
        className={`w-full grid-cols-1 gap-2 sm:grid-cols-2 ${
          isMobileActionsOpen ? "grid" : "hidden"
        } lg:hidden`}
      >
        <Button
          variant="outline"
          className="h-10 w-full border-rose-700/70 bg-rose-950/45 px-3 text-xs text-rose-100 hover:bg-rose-900/60 sm:text-sm"
          onClick={onAttendanceAction}
          disabled={disableAttendanceAction}
        >
          {isAttendanceActionLoading ? "Processando..." : attendanceActionLabel}
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full border-emerald-700/80 bg-emerald-950/60 px-3 text-xs text-emerald-100 hover:bg-emerald-900/70 sm:text-sm"
          onClick={onGenerateReport}
          disabled={disableGenerateReport}
          title={readinessHint ?? undefined}
        >
          {isGeneratingReport ? "Processando..." : reportActionLabel}
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 hover:bg-zinc-800 sm:col-span-2 sm:text-sm"
          onClick={onStartNewAttendance}
          disabled={disableNewAttendance}
        >
          {isStartingAttendance ? "Iniciando..." : "Novo atendimento"}
        </Button>
      </div>

      <div className="ml-auto hidden w-auto flex-wrap justify-end gap-2 lg:flex">
        <Button
          variant="outline"
          className="h-10 border-rose-700/70 bg-rose-950/45 px-3 text-sm text-rose-100 hover:bg-rose-900/60"
          onClick={onAttendanceAction}
          disabled={disableAttendanceAction}
        >
          {isAttendanceActionLoading ? "Processando..." : attendanceActionLabel}
        </Button>
        <Button
          variant="outline"
          className="h-10 border-emerald-700/80 bg-emerald-950/60 px-3 text-sm text-emerald-100 hover:bg-emerald-900/70"
          onClick={onGenerateReport}
          disabled={disableGenerateReport}
          title={readinessHint ?? undefined}
        >
          {isGeneratingReport ? "Processando..." : reportActionLabel}
        </Button>
        <Button
          variant="outline"
          className="h-10 border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 hover:bg-zinc-800"
          onClick={onStartNewAttendance}
          disabled={disableNewAttendance}
        >
          {isStartingAttendance ? "Iniciando..." : "Novo atendimento"}
        </Button>
      </div>
    </header>
  );
}
