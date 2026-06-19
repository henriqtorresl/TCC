import { ChevronDown, Loader2, Stethoscope } from "lucide-react";
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
    <header className="mx-3 mt-3 flex flex-wrap items-center gap-3 border-b border-white/10 px-1 pb-4 md:mx-4 md:px-1">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-primary">
        <Stethoscope className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
          Atendimento clínico
        </p>
        <h1 className="text-base font-semibold tracking-tight md:text-lg">
          Médico Digital
        </h1>
        <p className="text-xs text-foreground/65 md:text-sm">
          Assistente de anamnese com geração de relatório
        </p>
      </div>
      <div className="ml-auto lg:hidden">
        <Button
          type="button"
          size="icon"
          className="border-white/10 bg-white/6 text-foreground hover:bg-white/10"
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
          className="h-11 w-full border-white/10 bg-white/5 px-3 text-xs text-foreground hover:bg-white/10 sm:text-sm"
          onClick={onAttendanceAction}
          disabled={disableAttendanceAction}
        >
          {isAttendanceActionLoading ? "Processando..." : attendanceActionLabel}
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full border-white/10 bg-white/5 px-3 text-xs text-foreground hover:bg-white/10 sm:text-sm"
          onClick={onGenerateReport}
          disabled={disableGenerateReport}
          title={readinessHint ?? undefined}
        >
          {isGeneratingReport && <Loader2 className="size-4 animate-spin" />}
          {isGeneratingReport ? (
            <span className="inline-block h-4 w-28 animate-pulse rounded bg-white/15" />
          ) : (
            reportActionLabel
          )}
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full border-white/10 bg-white/5 px-3 text-xs text-foreground hover:bg-white/10 sm:col-span-2 sm:text-sm"
          onClick={onStartNewAttendance}
          disabled={disableNewAttendance}
        >
          {isStartingAttendance ? "Iniciando..." : "Novo atendimento"}
        </Button>
      </div>

      <div className="ml-auto hidden w-auto flex-wrap justify-end gap-2 lg:flex">
        <Button
          variant="outline"
          className="h-11 border-white/10 bg-white/5 px-3 text-sm text-foreground hover:bg-white/10"
          onClick={onAttendanceAction}
          disabled={disableAttendanceAction}
        >
          {isAttendanceActionLoading ? "Processando..." : attendanceActionLabel}
        </Button>
        <Button
          variant="outline"
          className="h-11 border-white/10 bg-white/5 px-3 text-sm text-foreground hover:bg-white/10"
          onClick={onGenerateReport}
          disabled={disableGenerateReport}
          title={readinessHint ?? undefined}
        >
          {isGeneratingReport && <Loader2 className="size-4 animate-spin" />}
          {isGeneratingReport ? (
            <span className="inline-block h-4 w-28 animate-pulse rounded bg-white/15" />
          ) : (
            reportActionLabel
          )}
        </Button>
        <Button
          variant="outline"
          className="h-11 border-white/10 bg-white/5 px-3 text-sm text-foreground hover:bg-white/10"
          onClick={onStartNewAttendance}
          disabled={disableNewAttendance}
        >
          {isStartingAttendance ? "Iniciando..." : "Novo atendimento"}
        </Button>
      </div>
    </header>
  );
}
