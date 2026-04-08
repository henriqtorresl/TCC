import { AttendanceSummary } from "@/components/chat/types";

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

export function formatAttendanceRelativeTime(dateString: string | null): string {
  if (!dateString) {
    return "Sem atividade";
  }

  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "agora";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min atrás`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h atrás`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} d atrás`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}
