"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Filter,
  MessageSquareMore,
  Stethoscope,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatAttendanceLabel,
  formatAttendanceRelativeTime,
  getAttendanceStatusLabel,
} from "@/components/chat/attendance-utils";
import { AttendanceSummary } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AttendancesPanelProps = {
  attendances: AttendanceSummary[];
  selectedAttendanceId: number | null;
  onSelectAttendance: (attendanceId: number) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalAttendances: number;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApplyDateFilter: () => void;
  onClearDateFilter: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

type FilterMode = "all" | "active" | "closed";

function AttendanceCard({
  attendance,
  isActive,
  onSelect,
}: {
  attendance: AttendanceSummary;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`h-auto w-full justify-start rounded-2xl border px-3 py-3 text-left transition-all ${
        isActive
          ? "border-white/10 bg-white/6"
          : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/8"
      }`}
    >
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            Atendimento #{attendance.id}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              attendance.status === "active"
                ? "bg-white/8 text-foreground"
                : "bg-white/8 text-foreground/65"
            }`}
          >
            {getAttendanceStatusLabel(attendance.status)}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-foreground/60">
          <Clock3 className="size-3.5" />
          {formatAttendanceLabel(attendance)}
        </p>

        <p className="flex items-center gap-1.5 text-sm text-foreground/60">
          <MessageSquareMore className="size-3.5" />
          {attendance.message_count} mensagens ·{" "}
          {formatAttendanceRelativeTime(attendance.last_message_at)}
        </p>
        <div className="pt-1">
          <Link
            href={`/attendances/${attendance.id}`}
            onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-white/10"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AttendancesPanel({
  attendances,
  selectedAttendanceId,
  onSelectAttendance,
  isLoading,
  page,
  totalPages,
  totalAttendances,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyDateFilter,
  onClearDateFilter,
  onPreviousPage,
  onNextPage,
}: AttendancesPanelProps) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const selectedAttendance = useMemo(
    () =>
      attendances.find(
        (attendance) => attendance.id === selectedAttendanceId,
      ) ?? null,
    [attendances, selectedAttendanceId],
  );

  const filteredAttendances = useMemo(() => {
    return attendances.filter((attendance) => {
      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "active" && attendance.status === "active") ||
        (filterMode === "closed" && attendance.status !== "active");

      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        String(attendance.id).includes(normalizedQuery) ||
        getAttendanceStatusLabel(attendance.status)
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [attendances, filterMode, query]);

  const filters: Array<{ id: FilterMode; label: string }> = [
    { id: "all", label: "Todos" },
    { id: "active", label: "Ativos" },
    { id: "closed", label: "Encerrados" },
  ];

  const hasAttendances = filteredAttendances.length > 0;

  function handleSelectAttendance(attendanceId: number) {
    onSelectAttendance(attendanceId);
    setIsMobileSheetOpen(false);
  }

  return (
    <>
      <aside className="hidden w-80 min-w-0 flex-col border-r border-white/10 bg-transparent md:flex">
        <div className="space-y-4 border-b border-white/10 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Atendimentos
            </h2>
            <div className="mt-0.5">
              {isLoading ? (
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
              ) : (
                <p className="text-sm text-foreground/65">
                  {totalAttendances} no histórico
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="Buscar por ID ou status..."
              className="h-10 pl-10 placeholder:text-foreground/40"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={filterMode === filter.id ? "default" : "outline"}
                className={
                  filterMode === filter.id
                    ? "bg-white/8 text-foreground"
                    : "border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
                }
                onClick={() => setFilterMode(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-between border-white/10 bg-white/5 text-foreground/85 hover:bg-white/10"
              onClick={() => setIsDateFilterOpen((current) => !current)}
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                Filtrar por data
              </span>
              <ChevronDown
                className={`size-4 text-foreground/45 transition-transform ${
                  isDateFilterOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            {isDateFilterOpen && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-foreground/70">
                  Período de início
                </p>
                <div className="space-y-2">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs text-foreground/55">De</p>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => onDateFromChange(event.target.value)}
                      className="date-input-highlight h-10 w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-xs text-foreground/55">Até</p>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(event) => onDateToChange(event.target.value)}
                      className="date-input-highlight h-10 w-full min-w-0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full bg-white/8 text-foreground"
                    onClick={onApplyDateFilter}
                  >
                    Aplicar filtro
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
                    onClick={onClearDateFilter}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="scrollbar-slim flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {isLoading && (
            <>
              <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            </>
          )}

          {!isLoading && !hasAttendances && (
            <div className="px-1 py-2 text-sm text-foreground/70">
              Nenhum atendimento encontrado com os filtros atuais.
            </div>
          )}

          {!isLoading &&
            filteredAttendances.map((attendance) => (
              <AttendanceCard
                key={attendance.id}
                attendance={attendance}
                isActive={selectedAttendanceId === attendance.id}
                onSelect={() => handleSelectAttendance(attendance.id)}
              />
            ))}
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
            disabled={page <= 1 || isLoading}
            onClick={onPreviousPage}
          >
            Anterior
          </Button>
          <p className="text-center text-sm text-foreground/65">
            Página {page} de {totalPages}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
            disabled={page >= totalPages || isLoading}
            onClick={onNextPage}
          >
            Próxima
          </Button>
        </div>
      </aside>

      <div className="px-3 py-3 md:hidden">
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-between border-white/10 bg-white/5 text-foreground hover:bg-white/10"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Stethoscope className="size-4 text-primary" />
                <span className="truncate">
                  {selectedAttendance
                  ? `Atendimento #${selectedAttendance.id}`
                  : "Selecionar atendimento"}
                </span>
              </span>
              <span className="text-xs text-foreground/55">
                {selectedAttendance
                  ? getAttendanceStatusLabel(selectedAttendance.status)
                  : `${attendances.length} itens`}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[82dvh] rounded-t-3xl p-0">
            <SheetHeader className="border-b border-white/10 px-4 py-4">
              <SheetTitle className="text-foreground">Atendimentos</SheetTitle>
            </SheetHeader>

            <div className="space-y-3 px-3 py-3 sm:px-4">
              <Input
                placeholder="Buscar atendimento..."
                className="h-10 placeholder:text-foreground/40"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <div className="flex gap-1.5">
                <Filter className="mt-2 size-4 text-foreground/45" />
                <div className="flex flex-wrap gap-1.5">
                  {filters.map((filter) => (
                    <Button
                      key={filter.id}
                      type="button"
                      size="sm"
                      variant={filterMode === filter.id ? "default" : "outline"}
                      className={
                        filterMode === filter.id
                          ? "bg-white/8 text-foreground"
                          : "border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
                      }
                      onClick={() => setFilterMode(filter.id)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="scrollbar-slim space-y-2 overflow-y-auto px-3 pb-4 sm:px-4">
              {isLoading && (
                <>
                  <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                  <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                </>
              )}

              {!isLoading && !hasAttendances && (
                <div className="px-1 py-2 text-xs text-foreground/65">
                  Nenhum atendimento encontrado.
                </div>
              )}

              {!isLoading &&
                filteredAttendances.map((attendance) => (
                  <AttendanceCard
                    key={attendance.id}
                    attendance={attendance}
                    isActive={selectedAttendanceId === attendance.id}
                    onSelect={() => handleSelectAttendance(attendance.id)}
                  />
                ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
