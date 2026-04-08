export type ChatMessage = {
  role: "user" | "assistant" | "system";
  text: string;
};

export type ChatApiResponse = {
  reply: string;
};

export type AttendanceSummary = {
  id: number;
  title: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  last_message_at: string | null;
  message_count: string;
};

export type AttendanceListResponse = {
  attendances: AttendanceSummary[];
};

export type AttendanceMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type AttendanceMessagesResponse = {
  messages: AttendanceMessage[];
};

export type StartAttendanceResponse = {
  conversationId: number;
};
