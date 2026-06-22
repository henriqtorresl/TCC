export type GenerateReportInput = {
  userId: number;
  conversationId: number;
  allowIncomplete?: boolean;
};

export type ReportCriterionKey =
  | "queixa_principal"
  | "inicio_duracao"
  | "evolucao"
  | "fatores_melhora_piora"
  | "sintomas_associados"
  | "antecedentes"
  | "medicacoes_alergias"
  | "habitos_contexto";

export type ConversationMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
};

export type ConversationSections = {
  queixa_principal: string | null;
  inicio_duracao: string | null;
  evolucao: string | null;
  fatores_melhora_piora: string | null;
  sintomas_associados: string | null;
  antecedentes: string | null;
  medicacoes_alergias: string | null;
  habitos_contexto: string | null;
};

export type ReportReadiness = {
  is_ready: boolean;
  score: number;
  required_score: number;
  criteria: Record<ReportCriterionKey, boolean>;
  missing_criteria: ReportCriterionKey[];
};

export type ConversationSignal = {
  key: ReportCriterionKey;
  positivePatterns: RegExp[];
  negativeEvidencePatterns?: RegExp[];
  rejectIfNegated?: boolean;
};

export type ConversationMetadata = {
  message_count: number;
  user_message_count: number;
  assistant_message_count: number;
  readiness: ReportReadiness;
  sections: ConversationSections;
  generation: {
    generated_at: string;
  };
};

export type ConversationRef = {
  status: string;
  ended_at: string | null;
};

export type ReportRef = {
  id: number | string;
  generated_at: string;
};

export type AttendanceSummaryRow = {
  id: number;
  title: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  last_message_at: string | null;
  message_count: string;
};

export type AttendanceMessageRow = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type AttendanceRow = {
  id: number;
  status: string;
  ended_at: string | null;
};

export type AttendanceDetailsRow = {
  id: number;
  title: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  last_message_at: string | null;
  message_count: string;
};

export type ListAttendancesOptions = {
  page: number;
  pageSize: number;
  dateFrom: string | null;
  dateTo: string | null;
};

export type AttendanceListResult = {
  attendances: AttendanceSummaryRow[];
  total: number;
};
