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
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
  };
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

export type AttendanceDetailsResponse = {
  attendance: AttendanceSummary;
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

export type ReportAvailabilityResponse = {
  conversationId: number;
  hasReport: boolean;
  canDownload: boolean;
  reportId: number | null;
};

export type ReportDownloadDataResponse = {
  report: {
    id: number;
    conversation_id: number;
    summary: string;
    status: string;
    metadata?: {
      readiness?: {
        is_ready?: boolean;
        score?: number;
        required_score?: number;
        missing_criteria?: string[];
      };
      sections?: Record<string, string | null>;
    } | null;
    generated_at: string;
  };
  attendance: {
    id: number;
    status: string;
    started_at: string;
    ended_at: string | null;
  };
  patient: {
    id: number;
    full_name: string;
  };
};
