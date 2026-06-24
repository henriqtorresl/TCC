import { InferenceClient } from "@huggingface/inference";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { ChatEntity, ChatRequest, ChatResponse } from "@/modules/chat/types";
import { ReportsService } from "../reports/reports.service";

const CHAT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const NER_MODEL = "d4data/biomedical-ner-all";

type ChatHistoryItem = {
  role: "user" | "assistant";
  text: string;
  ts: number;
};

type ListAttendancesQuery = {
  page?: string | null;
  pageSize?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export class ChatService {
  private readonly conversations: Record<string, ChatHistoryItem[]> = {};

  constructor(
    private readonly aiClient: InferenceClient,
    private readonly chatRepository: ChatRepository | null = null,
    private readonly reportsService: ReportsService | null = null,
  ) {}

  async sendMessage({
    patientId,
    text,
    userId,
  }: ChatRequest): Promise<ChatResponse> {
    if (!patientId || !text) {
      throw new Error("patientId e text são obrigatórios");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const conversationId =
      await this.chatRepository.ensureActiveConversation(numericPatientId);
    await this.chatRepository.saveMessage(conversationId, "user", text);

    const persistedHistory = await this.loadConversationHistory(
      numericPatientId,
      conversationId,
    );
    const conversationHistory = this.ensureCurrentUserMessage(
      persistedHistory,
      text,
    );
    this.conversations[String(numericPatientId)] = conversationHistory;

    let autoFinalized = false;
    if (this.reportsService) {
      try {
        const assessment = await this.reportsService.assessConversation({
          userId,
          conversationId,
        });

        if (assessment.shouldAutoFinalize) {
          const finalizeResult = await this.finalizeAttendance(
            String(patientId),
            String(conversationId),
          );

          autoFinalized = finalizeResult.status === "completed";
        }
      } catch (autoFinalizeError) {
        console.warn("Could not auto-finalize attendance:", autoFinalizeError);
      }
    }

    if (autoFinalized) {
      return {
        autoFinalized,
        conversationId,
      };
    }

    const messages = this.buildPromptMessages(conversationHistory);

    const completion = await this.aiClient.chatCompletion({
      model: CHAT_MODEL,
      messages,
      max_tokens: 150,
      temperature: 0.4,
      top_p: 0.95,
    });

    const rawBotText = completion?.choices?.[0]?.message?.content ?? "";
    const botText = this.sanitizeBotText(rawBotText);

    const timestamp = Date.now();
    this.conversations[String(numericPatientId)] = [
      ...conversationHistory,
      { role: "assistant", text: botText, ts: timestamp },
    ];

    const nerResult = await this.aiClient.tokenClassification({
      model: NER_MODEL,
      inputs: text,
    });

    const entities: ChatEntity[] = nerResult.map((entity) => ({
      label: entity.entity_group ?? entity.entity ?? "unknown",
      text: entity.word ?? "",
      score: entity.score ?? 0,
    }));

    await this.persistAssistantMessageIfPossible(
      conversationId,
      botText,
      entities,
    );

    return { reply: botText, entities, conversationId };
  }

  async startNewAttendance(
    patientId: string,
  ): Promise<{ conversationId: number }> {
    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    await this.chatRepository.closeLatestActiveConversation(numericPatientId);
    const conversationId =
      await this.chatRepository.createConversation(numericPatientId);
    this.conversations[patientId] = [];

    return { conversationId };
  }

  async listAttendances(patientId: string, query: ListAttendancesQuery = {}) {
    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "10");
    const normalizedPage =
      Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const normalizedPageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(Math.floor(pageSize), 50)
        : 10;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dateFrom = query.dateFrom?.trim() ?? "";
    const dateTo = query.dateTo?.trim() ?? "";

    if (dateFrom && !dateRegex.test(dateFrom)) {
      throw new Error("invalid_date_from");
    }

    if (dateTo && !dateRegex.test(dateTo)) {
      throw new Error("invalid_date_to");
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new Error("invalid_date_range");
    }

    const result = await this.chatRepository.listAttendancesByPatientPaginated(
      numericPatientId,
      {
        page: normalizedPage,
        pageSize: normalizedPageSize,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    );

    const totalPages = Math.max(
      1,
      Math.ceil(result.total / normalizedPageSize),
    );

    return {
      attendances: result.attendances,
      pagination: {
        page: normalizedPage,
        pageSize: normalizedPageSize,
        total: result.total,
        totalPages,
      },
      filters: {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    };
  }

  async listAttendanceMessages(patientId: string, attendanceId: string) {
    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    const numericAttendanceId = Number(attendanceId);
    if (!Number.isFinite(numericAttendanceId) || numericAttendanceId <= 0) {
      throw new Error("invalid_attendance_id");
    }

    const messages = await this.chatRepository.listMessagesByAttendance(
      numericPatientId,
      numericAttendanceId,
    );

    if (!messages) {
      throw new Error("attendance_not_found");
    }

    return messages;
  }

  async getAttendanceDetails(patientId: string, attendanceId: string) {
    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    const numericAttendanceId = Number(attendanceId);
    if (!Number.isFinite(numericAttendanceId) || numericAttendanceId <= 0) {
      throw new Error("invalid_attendance_id");
    }

    const attendance = await this.chatRepository.findAttendanceDetailsById(
      numericPatientId,
      numericAttendanceId,
    );

    if (!attendance) {
      throw new Error("attendance_not_found");
    }

    return attendance;
  }

  async finalizeAttendance(patientId: string, attendanceId: string) {
    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    const numericAttendanceId = Number(attendanceId);
    if (!Number.isFinite(numericAttendanceId) || numericAttendanceId <= 0) {
      throw new Error("invalid_attendance_id");
    }

    const attendance = await this.chatRepository.findAttendanceById(
      numericPatientId,
      numericAttendanceId,
    );

    if (!attendance) {
      throw new Error("attendance_not_found");
    }

    if (attendance.status !== "active") {
      throw new Error("attendance_already_completed");
    }

    const closed = await this.chatRepository.closeAttendanceById(
      numericPatientId,
      numericAttendanceId,
    );

    if (!closed) {
      throw new Error("attendance_close_failed");
    }

    return {
      attendanceId: closed.id,
      status: closed.status,
      ended_at: closed.ended_at,
    };
  }

  async resumeAttendance(patientId: string, attendanceId: string) {
    if (!this.chatRepository) {
      throw new Error("database_not_configured");
    }

    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
      throw new Error("invalid_patient_id");
    }

    const numericAttendanceId = Number(attendanceId);
    if (!Number.isFinite(numericAttendanceId) || numericAttendanceId <= 0) {
      throw new Error("invalid_attendance_id");
    }

    const attendance = await this.chatRepository.findAttendanceById(
      numericPatientId,
      numericAttendanceId,
    );

    if (!attendance) {
      throw new Error("attendance_not_found");
    }

    if (attendance.status === "active") {
      throw new Error("attendance_already_active");
    }

    await this.chatRepository.closeLatestActiveConversation(numericPatientId);

    const reopened = await this.chatRepository.reopenAttendanceById(
      numericPatientId,
      numericAttendanceId,
    );

    if (!reopened) {
      throw new Error("attendance_reopen_failed");
    }

    this.conversations[patientId] = await this.loadConversationHistory(
      numericPatientId,
      reopened.id,
    );

    return {
      attendanceId: reopened.id,
      status: reopened.status,
      ended_at: reopened.ended_at,
    };
  }

  private sanitizeBotText(botText: string): string {
    let value = botText.replace(/\(\?:\n\n\)\??/g, "");
    const metadataPatterns = [
      /runs on [a-zA-Z0-9\-]{10,}[a-zA-Z0-9]*/g,
      /served by [a-zA-Z0-9\-]{10,}[a-zA-Z0-9]*/g,
      /model id: [a-zA-Z0-9\-\.]+/g,
    ];

    for (const pattern of metadataPatterns) {
      value = value.replace(pattern, "");
    }

    value = value.replace(/(\n\s*){2,}/g, "\n");
    return value.trim();
  }

  private ensureCurrentUserMessage(
    history: ChatHistoryItem[],
    userText: string,
  ): ChatHistoryItem[] {
    const lastMessage = history[history.length - 1];
    if (lastMessage?.role === "user" && lastMessage.text === userText) {
      return history;
    }

    return [...history, { role: "user", text: userText, ts: Date.now() }];
  }

  private buildPromptMessages(history: ChatHistoryItem[]) {
    const systemPrompt = [
      "Você é um assistente médico virtual especializado em conduzir uma anamnese.",
      "Seu objetivo é coletar informações como queixa principal, início, evolução, fatores de melhora/piora, antecedentes e hábitos.",
      "",
      "Mantenha um tom profissional, buscando uma conversa natural, mas sem ser excessivamente seco.",
      "",
      "Sua regra mais importante é: faça apenas UMA pergunta de cada vez, sempre que possível.",
      "",
      "Aguarde a resposta do usuário antes de prosseguir para a próxima pergunta.",
      "Formule perguntas claras e objetivas para guiar o diálogo, avançando passo a passo na coleta de informações.",
      "Não dê diagnóstico final; seu papel é exclusivamente coletar as informações de forma sequencial.",
    ].join("\n");

    return [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-20).map((entry) => ({
        role: entry.role,
        content: entry.text,
      })),
    ];
  }

  private async loadConversationHistory(
    patientId: number,
    conversationId?: number,
  ): Promise<ChatHistoryItem[]> {
    const memoryHistory = this.conversations[String(patientId)] ?? [];

    if (!this.chatRepository) {
      return memoryHistory;
    }

    const activeConversationId =
      conversationId ??
      (await this.chatRepository.findLatestActiveConversationId(patientId));

    if (!activeConversationId) {
      return memoryHistory;
    }

    const persistedMessages =
      await this.chatRepository.listMessagesByConversationId(
        activeConversationId,
      );

    return persistedMessages
      .filter(
        (message) => message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({
        role: message.role as "user" | "assistant",
        text: message.content,
        ts: Date.parse(message.created_at) || Date.now(),
      }));
  }

  private async persistAssistantMessageIfPossible(
    conversationId: number,
    assistantText: string,
    entities: ChatEntity[],
  ): Promise<void> {
    if (!this.chatRepository) {
      return;
    }

    try {
      await this.chatRepository.saveMessage(
        conversationId,
        "assistant",
        assistantText,
        entities,
      );
    } catch (error) {
      console.warn("Could not persist chat messages:", error);
    }
  }
}
