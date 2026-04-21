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

export type ReportReadiness = {
  is_ready: boolean;
  score: number;
  required_score: number;
  criteria: Record<string, boolean>;
  missing_criteria: string[];
};

export type ReportGenerateResponse = {
  id: number;
  user_id: number;
  conversation_id: number;
  summary: string;
  status: string;
  metadata?: {
    readiness?: ReportReadiness;
  };
  generated_at: string;
};

export type ConversationNotReadyErrorResponse = {
  error: "conversation_not_ready";
  details: {
    missingCriteria: string[];
  };
};

export type ReportReadinessResponse = {
  conversationId: number;
  conversationStatus: string;
  messageCount: number;
  readiness: ReportReadiness;
  sections: Record<string, string | null>;
};

export type FinalizeAttendanceResponse = {
  attendanceId: number;
  status: string;
  ended_at: string | null;
};
