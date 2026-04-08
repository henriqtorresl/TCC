import { AttendanceSummary } from "@/app/_components/chat/types";

export function formatAttendanceLabel(attendance: AttendanceSummary): string {
  const date = new Date(attendance.started_at);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getAttendanceStatusLabel(status: string): string {
  return status === "active" ? "Ativo" : "Encerrado";
}
