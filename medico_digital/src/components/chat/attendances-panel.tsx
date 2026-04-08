"use client";

import { Clock3, Filter, MessageSquareMore, Stethoscope } from "lucide-react";
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
    <Button
      type="button"
      onClick={onSelect}
      variant="ghost"
      className={`h-auto w-full justify-start rounded-xl border px-3 py-3 text-left transition ${
        isActive
          ? "border-emerald-500/60 bg-gradient-to-r from-emerald-900/35 to-emerald-700/10 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
          : "border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-100">
            Atendimento #{attendance.id}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              attendance.status === "active"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-zinc-700/60 text-zinc-300"
            }`}
          >
            {getAttendanceStatusLabel(attendance.status)}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock3 className="size-3.5" />
          {formatAttendanceLabel(attendance)}
        </p>

        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <MessageSquareMore className="size-3.5" />
          {attendance.message_count} mensagens ·{" "}
          {formatAttendanceRelativeTime(attendance.last_message_at)}
        </p>
      </div>
    </Button>
  );
}

export function AttendancesPanel({
  attendances,
  selectedAttendanceId,
  onSelectAttendance,
  isLoading,
}: AttendancesPanelProps) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const selectedAttendance = useMemo(
    () => attendances.find((attendance) => attendance.id === selectedAttendanceId) ?? null,
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
      <aside className="hidden w-80 flex-col border-r border-zinc-800/80 bg-zinc-950/70 backdrop-blur md:flex">
        <div className="space-y-3 border-b border-zinc-800/80 px-4 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Atendimentos</h2>
            <p className="text-xs text-zinc-400">
              {attendances.length} no histórico
            </p>
          </div>

          <Input
            placeholder="Buscar por id ou status..."
            className="h-9 border-zinc-700 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="flex gap-1">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={filterMode === filter.id ? "default" : "outline"}
                className={
                  filterMode === filter.id
                    ? "bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                }
                onClick={() => setFilterMode(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {isLoading && (
            <>
              <div className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />
              <div className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />
              <div className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />
            </>
          )}

          {!isLoading && !hasAttendances && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs text-zinc-400">
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
      </aside>

      <div className="border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-3 md:hidden">
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            >
              <span className="flex items-center gap-2">
                <Stethoscope className="size-4 text-emerald-400" />
                {selectedAttendance
                  ? `Atendimento #${selectedAttendance.id}`
                  : "Selecionar atendimento"}
              </span>
              <span className="text-xs text-zinc-400">
                {selectedAttendance
                  ? getAttendanceStatusLabel(selectedAttendance.status)
                  : `${attendances.length} itens`}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[82dvh] rounded-t-2xl border-zinc-800 bg-zinc-950 p-0">
            <SheetHeader className="border-b border-zinc-800 px-4 py-4">
              <SheetTitle className="text-zinc-100">Atendimentos</SheetTitle>
            </SheetHeader>

            <div className="space-y-3 px-4 py-3">
              <Input
                placeholder="Buscar atendimento..."
                className="h-10 border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <div className="flex gap-1.5">
                <Filter className="mt-2 size-4 text-zinc-500" />
                <div className="flex flex-wrap gap-1.5">
                  {filters.map((filter) => (
                    <Button
                      key={filter.id}
                      type="button"
                      size="sm"
                      variant={filterMode === filter.id ? "default" : "outline"}
                      className={
                        filterMode === filter.id
                          ? "bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
                          : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                      }
                      onClick={() => setFilterMode(filter.id)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto px-3 pb-4">
              {isLoading && (
                <>
                  <div className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />
                  <div className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70" />
                </>
              )}

              {!isLoading && !hasAttendances && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs text-zinc-400">
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
