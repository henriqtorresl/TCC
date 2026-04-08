import {
  formatAttendanceLabel,
  getAttendanceStatusLabel,
} from "@/components/chat/attendance-utils";
import { AttendanceSummary } from "@/components/chat/types";

type AttendancesPanelProps = {
  attendances: AttendanceSummary[];
  selectedAttendanceId: number | null;
  onSelectAttendance: (attendanceId: number) => void;
};

export function AttendancesPanel({
  attendances,
  selectedAttendanceId,
  onSelectAttendance,
}: AttendancesPanelProps) {
  function handleSelectChange(value: string) {
    const attendanceId = Number(value);
    if (!Number.isFinite(attendanceId) || attendanceId <= 0) {
      return;
    }
    onSelectAttendance(attendanceId);
  }

  return (
    <>
      <aside className="hidden w-72 flex-col border-r border-zinc-800 bg-zinc-900/40 md:flex">
        <div className="border-b border-zinc-800 px-4 py-4">
          <h2 className="text-sm font-semibold text-zinc-200">Atendimentos</h2>
          <p className="text-xs text-zinc-400">Histórico por usuário</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {attendances.length === 0 && (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
              Nenhum atendimento salvo ainda.
            </p>
          )}
          {attendances.map((attendance) => (
            <button
              key={attendance.id}
              type="button"
              onClick={() => onSelectAttendance(attendance.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                selectedAttendanceId === attendance.id
                  ? "border-emerald-500/50 bg-emerald-900/20"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <p className="text-sm font-medium text-zinc-200">
                Atendimento #{attendance.id}
              </p>
              <p className="text-xs text-zinc-400">
                {formatAttendanceLabel(attendance)}
              </p>
              <p className="text-xs text-zinc-500">
                {getAttendanceStatusLabel(attendance.status)} ·{" "}
                {attendance.message_count} mensagens
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div className="border-b border-zinc-800 px-4 py-3 md:hidden">
        <select
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none"
          value={selectedAttendanceId ?? ""}
          onChange={(event) => handleSelectChange(event.target.value)}
        >
          <option value="" disabled>
            Selecione um atendimento
          </option>
          {attendances.map((attendance) => (
            <option key={attendance.id} value={attendance.id}>
              #{attendance.id} - {getAttendanceStatusLabel(attendance.status)} -{" "}
              {formatAttendanceLabel(attendance)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
