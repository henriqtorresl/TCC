import { InferenceClient } from "@huggingface/inference";
import { ReportsRepository } from "@/modules/reports/reports.repository";
import type {
  AiConversationSections,
  ConversationMetadata,
  ConversationMessage,
  ConversationRef,
  ConversationSections,
  ConversationSignal,
  ReportCriterionKey,
  ReportRef,
  ReportReadiness,
} from "@/modules/reports/types";

const REQUIRED_CRITERIA_SCORE = 7;
const REPORT_AI_MODEL = "meta-llama/Llama-3.1-8B-Instruct";

const REPORT_CRITERIA_LABELS: Record<ReportCriterionKey, string> = {
  queixa_principal: "queixa principal",
  inicio_duracao: "início e duração",
  evolucao: "evolução",
  fatores_melhora_piora: "fatores de melhora/piora",
  sintomas_associados: "sintomas associados",
  antecedentes: "antecedentes",
  medicacoes_alergias: "medicações e alergias",
  habitos_contexto: "hábitos e contexto",
};

const CONVERSATION_SIGNALS: ConversationSignal[] = [
  {
    key: "queixa_principal",
    rejectIfNegated: true,
    positivePatterns: [
      /(?:^|\b)(dor(?:es)?|febre|tosse|falta de ar|dispneia|nausea|vomito|vomitar|diarreia|tontura|cansaco|palpitacao|inchaco|cefaleia|dor de cabeca|mal-estar)(?:\b|$)/i,
    ],
  },
  {
    key: "inicio_duracao",
    positivePatterns: [
      /\bdesde\b/i,
      /\bha\s*\d+\s*(hora|horas|dia|dias|semana|semanas|mes|meses|ano|anos)\b/i,
      /\bcomecou\b/i,
      /\binicio\b/i,
      /\bduracao\b/i,
      /\bha tempo\b/i,
    ],
  },
  {
    key: "evolucao",
    positivePatterns: [
      /\bpiorou\b/i,
      /\bmelhorou\b/i,
      /\bestavel\b/i,
      /\bprogressiv/i,
      /\bevolucao\b/i,
      /\bnao melhorou\b/i,
      /\bsem melhora\b/i,
    ],
  },
  {
    key: "fatores_melhora_piora",
    positivePatterns: [
      /\bpiora com\b/i,
      /\bmelhora com\b/i,
      /\bpiora ao\b/i,
      /\bmelhora ao\b/i,
      /\balivia com\b/i,
      /\bagrava com\b/i,
      /\bnao melhora com\b/i,
      /\bpiora quando\b/i,
      /\bmelhora quando\b/i,
    ],
  },
  {
    key: "sintomas_associados",
    rejectIfNegated: true,
    positivePatterns: [
      /\balem disso\b/i,
      /\btambem\b.*\b(sinto|tenho|apresento|percebo|noto|vem|apareceu|junto)\b/i,
      /\bsintomas associados\b/i,
      /\boutro sintoma\b/i,
      /\bjunto com\b/i,
      /\bassociado\b/i,
      /\bvem acompanhado\b/i,
    ],
  },
  {
    key: "antecedentes",
    positivePatterns: [
      /\bhiperten/i,
      /\bdiabet/i,
      /\basma\b/i,
      /\bcardi/i,
      /\bcirurg/i,
      /\binterna/i,
      /\bantecedent/i,
      /\bhistorico familiar\b/i,
      /\bdoenca cronica\b/i,
      /\bcomorbidade\b/i,
    ],
    negativeEvidencePatterns: [
      /\bsem antecedent/i,
      /\bnao tenho doenca cronica\b/i,
      /\bnao tenho comorbidade\b/i,
      /\bsem comorbidade\b/i,
      /\bnao tenho historico\b/i,
      /\bnao tenho nada\b/i,
    ],
  },
  {
    key: "medicacoes_alergias",
    positivePatterns: [
      /\b(tomo|uso|faco uso)\b.*\b(de )?(medicacao|medicamento|remedio)s?\b/i,
      /\bmedicacao\b/i,
      /\bmedicamento\b/i,
      /\bremedio\b/i,
      /\balergi/i,
      /\breacao alergica\b/i,
      /\bintolerancia\b/i,
    ],
    negativeEvidencePatterns: [
      /\bnao uso\b/i,
      /\bnao tomo\b/i,
      /\bsem medicacao\b/i,
      /\bsem remedio\b/i,
      /\bnao tenho alergia\b/i,
      /\bsem alergia\b/i,
      /\bnao sou alergic/i,
    ],
  },
  {
    key: "habitos_contexto",
    positivePatterns: [
      /\bfumo\b/i,
      /\btabag/i,
      /\bcigarro\b/i,
      /\balcool\b/i,
      /\bbebida/i,
      /\bdrogas?\b/i,
      /\batividade fisica\b/i,
      /\bsedentario\b/i,
      /\bsono\b/i,
      /\btrabalho\b/i,
      /\balimentacao\b/i,
      /\bdieta\b/i,
    ],
    negativeEvidencePatterns: [
      /\bnao fumo\b/i,
      /\bnao bebo\b/i,
      /\bnao uso drogas\b/i,
      /\bsem alcool\b/i,
      /\bsem cigarro\b/i,
      /\bnao pratico atividade fisica\b/i,
    ],
  },
];

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string): string {
  return normalizeSpaces(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitIntoCandidates(message: string): string[] {
  const fragments = message
    .split(/[\n.,;!?]+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  return fragments.length > 0 ? fragments : [message];
}

function hasNegationCue(value: string): boolean {
  return /\b(nao|sem|nega|negou|nunca|ausente|ausencia de)\b/.test(value);
}

function extractJsonObject(rawText: string): string | null {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return rawText.slice(start, end + 1).trim();
  }

  return null;
}

function normalizeAiSectionValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeSpaces(value);
  return normalized.length > 0 ? normalized.slice(0, 280) : null;
}

export function mergeSections(
  base: ConversationSections,
  aiSections: AiConversationSections,
): ConversationSections {
  return {
    queixa_principal:
      base.queixa_principal ??
      normalizeAiSectionValue(aiSections.queixa_principal),
    inicio_duracao:
      base.inicio_duracao ?? normalizeAiSectionValue(aiSections.inicio_duracao),
    evolucao: base.evolucao ?? normalizeAiSectionValue(aiSections.evolucao),
    fatores_melhora_piora:
      base.fatores_melhora_piora ??
      normalizeAiSectionValue(aiSections.fatores_melhora_piora),
    sintomas_associados:
      base.sintomas_associados ??
      normalizeAiSectionValue(aiSections.sintomas_associados),
    antecedentes:
      base.antecedentes ?? normalizeAiSectionValue(aiSections.antecedentes),
    medicacoes_alergias:
      base.medicacoes_alergias ??
      normalizeAiSectionValue(aiSections.medicacoes_alergias),
    habitos_contexto:
      base.habitos_contexto ??
      normalizeAiSectionValue(aiSections.habitos_contexto),
  };
}

export function parseAiSections(
  rawText: string,
): AiConversationSections | null {
  const jsonText = extractJsonObject(rawText);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    return {
      queixa_principal: normalizeAiSectionValue(parsed.queixa_principal),
      inicio_duracao: normalizeAiSectionValue(parsed.inicio_duracao),
      evolucao: normalizeAiSectionValue(parsed.evolucao),
      fatores_melhora_piora: normalizeAiSectionValue(
        parsed.fatores_melhora_piora,
      ),
      sintomas_associados: normalizeAiSectionValue(parsed.sintomas_associados),
      antecedentes: normalizeAiSectionValue(parsed.antecedentes),
      medicacoes_alergias: normalizeAiSectionValue(parsed.medicacoes_alergias),
      habitos_contexto: normalizeAiSectionValue(parsed.habitos_contexto),
    };
  } catch {
    return null;
  }
}

function formatTranscriptForAi(messages: ConversationMessage[]): string {
  return messages
    .map(
      (message, index) =>
        `${index + 1}. [${message.role}] ${normalizeSpaces(message.content)}`,
    )
    .join("\n");
}

export function findFirstMatchingSnippet(
  messages: string[],
  signal: ConversationSignal,
): string | null {
  const candidates = messages.flatMap((message) =>
    splitIntoCandidates(message),
  );

  let bestText = "";
  let bestScore = -1;
  let bestOrder = -1;

  candidates.forEach((candidate, index) => {
    const normalized = normalizeText(candidate);
    const positiveMatch = signal.positivePatterns.some((pattern) =>
      pattern.test(normalized),
    );
    const negativeEvidenceMatch = Boolean(
      signal.negativeEvidencePatterns?.some((pattern) =>
        pattern.test(normalized),
      ),
    );

    if (!positiveMatch && !negativeEvidenceMatch) {
      return;
    }

    if (signal.rejectIfNegated && hasNegationCue(normalized)) {
      return;
    }

    const score =
      (positiveMatch ? 2 : 0) +
      (negativeEvidenceMatch ? 1 : 0) +
      Math.min(candidate.length, 140) / 140;

    if (score > bestScore || (score === bestScore && index > bestOrder)) {
      bestText = candidate;
      bestScore = score;
      bestOrder = index;
    }
  });

  if (bestOrder < 0) {
    return null;
  }

  return bestText.slice(0, 280);
}

export function extractSections(
  messages: ConversationMessage[],
): ConversationSections {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => normalizeSpaces(message.content));

  const sections: ConversationSections = {
    queixa_principal: null,
    inicio_duracao: null,
    evolucao: null,
    fatores_melhora_piora: null,
    sintomas_associados: null,
    antecedentes: null,
    medicacoes_alergias: null,
    habitos_contexto: null,
  };

  for (const signal of CONVERSATION_SIGNALS) {
    sections[signal.key] = findFirstMatchingSnippet(userMessages, signal);
  }

  return sections;
}

export function calculateReadiness(
  sections: ConversationSections,
): ReportReadiness {
  const criteria: Record<ReportCriterionKey, boolean> = {
    queixa_principal: Boolean(sections.queixa_principal),
    inicio_duracao: Boolean(sections.inicio_duracao),
    evolucao: Boolean(sections.evolucao),
    fatores_melhora_piora: Boolean(sections.fatores_melhora_piora),
    sintomas_associados: Boolean(sections.sintomas_associados),
    antecedentes: Boolean(sections.antecedentes),
    medicacoes_alergias: Boolean(sections.medicacoes_alergias),
    habitos_contexto: Boolean(sections.habitos_contexto),
  };

  const score = Object.values(criteria).filter(Boolean).length;
  const missing_criteria = Object.entries(criteria)
    .filter(([, met]) => !met)
    .map(([key]) => key as ReportCriterionKey);

  return {
    is_ready: score >= REQUIRED_CRITERIA_SCORE,
    score,
    required_score: REQUIRED_CRITERIA_SCORE,
    criteria,
    missing_criteria,
  };
}

export function shouldAutoFinalizeConversation(
  readiness: ReportReadiness,
): boolean {
  return readiness.is_ready;
}

export function buildSummary({
  conversationId,
  sections,
  readiness,
  messages,
}: {
  conversationId: number;
  sections: ConversationSections;
  readiness: ReportReadiness;
  messages: ConversationMessage[];
}): string {
  const lines = [
    `Relatório de anamnese - Atendimento #${conversationId}`,
    `Completude: ${readiness.score}/${readiness.required_score}`,
    "",
    `Queixa principal: ${sections.queixa_principal ?? "Não informado."}`,
    `Início e duração: ${sections.inicio_duracao ?? "Não informado."}`,
    `Evolução: ${sections.evolucao ?? "Não informado."}`,
    `Fatores de melhora/piora: ${sections.fatores_melhora_piora ?? "Não informado."}`,
    `Sintomas associados: ${sections.sintomas_associados ?? "Não informado."}`,
    `Antecedentes: ${sections.antecedentes ?? "Não informado."}`,
    `Medicações e alergias: ${sections.medicacoes_alergias ?? "Não informado."}`,
    `Hábitos e contexto: ${sections.habitos_contexto ?? "Não informado."}`,
    "",
    readiness.missing_criteria.length > 0
      ? `Pendências: ${readiness.missing_criteria
          .map((criterion) => REPORT_CRITERIA_LABELS[criterion] ?? criterion)
          .join(", ")}`
      : "Pendências: nenhuma.",
    "",
    "Observação: este relatório representa triagem/anamnese e não substitui diagnóstico médico.",
    `Total de mensagens analisadas: ${messages.length}`,
  ];

  return lines.join("\n").slice(0, 8000);
}

export function assessConversation(messages: ConversationMessage[]) {
  const sections = extractSections(messages);
  const readiness = calculateReadiness(sections);

  return {
    sections,
    readiness,
    shouldAutoFinalize: shouldAutoFinalizeConversation(readiness),
  };
}

export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository | null = null,
    private readonly aiClient: InferenceClient | null = null,
  ) {}

  async assessConversation({
    userId,
    conversationId,
  }: {
    userId: number;
    conversationId: number;
  }) {
    const { conversation, messages, numericConversationId } =
      await this.loadConversationContext({
        userId,
        conversationId,
      });

    const assessment = await this.evaluateConversation(messages);

    return {
      conversationId: numericConversationId,
      conversationStatus: conversation.status,
      messageCount: messages.length,
      readiness: assessment.readiness,
      sections: assessment.sections,
      shouldAutoFinalize: assessment.shouldAutoFinalize,
    };
  }

  async generate({
    userId,
    conversationId,
    allowIncomplete = false,
  }: {
    userId: number;
    conversationId: number;
    allowIncomplete?: boolean;
  }) {
    if (!this.reportsRepository) {
      throw new Error("database_not_configured");
    }

    const { conversation, messages, numericConversationId, numericUserId } =
      await this.loadConversationContext({
        userId,
        conversationId,
      });

    const latestValidReport = await this.getLatestValidReportForConversation({
      userId: numericUserId,
      conversationId: numericConversationId,
    });

    if (latestValidReport) {
      return latestValidReport;
    }

    if (conversation.status !== "completed" && !allowIncomplete) {
      throw new Error("conversation_not_completed");
    }

    const assessment = await this.evaluateConversation(messages);
    const sections = assessment.sections;
    const readiness = assessment.readiness;

    if (!readiness.is_ready && !allowIncomplete) {
      throw new Error(
        `conversation_not_ready:${readiness.missing_criteria.join(",")}`,
      );
    }

    const summary = buildSummary({
      conversationId: numericConversationId,
      sections,
      readiness,
      messages,
    });

    const metadata: ConversationMetadata = {
      message_count: messages.length,
      user_message_count: messages.filter((message) => message.role === "user")
        .length,
      assistant_message_count: messages.filter(
        (message) => message.role === "assistant",
      ).length,
      readiness,
      sections,
      generation: {
        generated_at: new Date().toISOString(),
        ai_enhanced: assessment.aiEnhanced,
        ai_model: assessment.aiModel,
      },
    };

    return this.reportsRepository.createReport({
      userId: numericUserId,
      conversationId: numericConversationId,
      summary,
      metadata,
    });
  }

  private async evaluateConversation(messages: ConversationMessage[]) {
    const baseAssessment = assessConversation(messages);
    const userMessages = messages.filter((m) => m.role === "user").length;
    const minMessages = 15;

    if (
      !this.aiClient ||
      baseAssessment.readiness.is_ready ||
      userMessages < minMessages
    ) {
      return {
        ...baseAssessment,
        aiEnhanced: false,
        aiModel: null,
      };
    }

    try {
      const completion = await this.aiClient.chatCompletion({
        model: REPORT_AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Você é um extrator clínico. Analise a conversa e devolva apenas JSON válido com as chaves de anamnese. Não invente dados. Use somente informações presentes ou claramente implícitas na conversa.",
          },
          {
            role: "user",
            content: [
              "Conversa completa:",
              formatTranscriptForAi(messages),
              "",
              "Seções já detectadas pelo sistema:",
              JSON.stringify(baseAssessment.sections, null, 2),
              "",
              "Retorne um objeto JSON com as chaves: queixa_principal, inicio_duracao, evolucao, fatores_melhora_piora, sintomas_associados, antecedentes, medicacoes_alergias, habitos_contexto.",
              "Preencha apenas o que conseguir identificar com segurança na conversa.",
              "Use strings curtas e objetivas. Se não houver evidência suficiente, use null.",
            ].join("\n"),
          },
        ],
        max_tokens: 350,
        temperature: 0.1,
        top_p: 0.9,
      });

      const rawText = completion?.choices?.[0]?.message?.content ?? "";
      const parsedSections = parseAiSections(rawText);
      if (!parsedSections) {
        return {
          ...baseAssessment,
          aiEnhanced: false,
          aiModel: REPORT_AI_MODEL,
        };
      }

      const mergedSections = mergeSections(
        baseAssessment.sections,
        parsedSections,
      );
      const readiness = calculateReadiness(mergedSections);

      return {
        sections: mergedSections,
        readiness,
        shouldAutoFinalize: shouldAutoFinalizeConversation(readiness),
        aiEnhanced: true,
        aiModel: REPORT_AI_MODEL,
      };
    } catch (error) {
      console.warn("Could not enhance report extraction with AI:", error);

      return {
        ...baseAssessment,
        aiEnhanced: false,
        aiModel: REPORT_AI_MODEL,
      };
    }
  }

  async getReportAvailability({
    userId,
    conversationId,
  }: {
    userId: number;
    conversationId: number;
  }) {
    if (!this.reportsRepository) {
      throw new Error("database_not_configured");
    }

    const numericUserId = Number(userId);
    const numericConversationId = Number(conversationId);
    if (
      !Number.isFinite(numericUserId) ||
      numericUserId <= 0 ||
      !Number.isFinite(numericConversationId) ||
      numericConversationId <= 0
    ) {
      throw new Error("invalid_ids");
    }

    const conversation =
      await this.reportsRepository.findConversationByIdForUser(
        numericConversationId,
        numericUserId,
      );
    if (!conversation) {
      throw new Error("conversation_not_found");
    }

    const latestReport =
      await this.reportsRepository.findLatestReportByConversationForUser(
        numericConversationId,
        numericUserId,
      );

    const canDownload = this.isReportUpToDate(conversation, latestReport);

    return {
      conversationId: numericConversationId,
      hasReport: Boolean(latestReport),
      canDownload,
      reportId: canDownload ? Number(latestReport.id) : null,
    };
  }

  async getById(reportId: string) {
    if (!this.reportsRepository) {
      throw new Error("database_not_configured");
    }

    const numericReportId = Number(reportId);
    if (!Number.isFinite(numericReportId) || numericReportId <= 0) {
      throw new Error("invalid_report_id");
    }

    const report = await this.reportsRepository.findReportById(numericReportId);
    if (!report) {
      throw new Error("report_not_found");
    }

    return report;
  }

  async generatePdfById({
    reportId,
    userId,
  }: {
    reportId: string;
    userId: number;
  }) {
    if (!this.reportsRepository) {
      throw new Error("database_not_configured");
    }

    const numericReportId = Number(reportId);
    const numericUserId = Number(userId);
    if (
      !Number.isFinite(numericReportId) ||
      numericReportId <= 0 ||
      !Number.isFinite(numericUserId) ||
      numericUserId <= 0
    ) {
      throw new Error("invalid_ids");
    }

    const report = await this.reportsRepository.findReportById(numericReportId);
    if (!report || Number(report.user_id) !== numericUserId) {
      throw new Error("report_not_found");
    }

    const conversation =
      await this.reportsRepository.findConversationWithPatientByIdForUser(
        Number(report.conversation_id),
        numericUserId,
      );

    if (!conversation) {
      throw new Error("conversation_not_found");
    }

    return {
      report: {
        id: report.id,
        conversation_id: report.conversation_id,
        summary: report.summary,
        status: report.status,
        metadata: report.metadata ?? null,
        generated_at: report.generated_at,
      },
      attendance: {
        id: conversation.id,
        status: conversation.status,
        started_at: conversation.started_at,
        ended_at: conversation.ended_at,
      },
      patient: {
        id: conversation.patient_id,
        full_name: conversation.patient_full_name,
      },
    };
  }

  private async loadConversationContext({
    userId,
    conversationId,
  }: {
    userId: number;
    conversationId: number;
  }) {
    if (!this.reportsRepository) {
      throw new Error("database_not_configured");
    }

    const numericUserId = Number(userId);
    const numericConversationId = Number(conversationId);
    if (
      !Number.isFinite(numericUserId) ||
      numericUserId <= 0 ||
      !Number.isFinite(numericConversationId) ||
      numericConversationId <= 0
    ) {
      throw new Error("invalid_ids");
    }

    const conversation =
      await this.reportsRepository.findConversationByIdForUser(
        numericConversationId,
        numericUserId,
      );
    if (!conversation) {
      throw new Error("conversation_not_found");
    }

    const messages = (await this.reportsRepository.getConversationMessages(
      numericConversationId,
    )) as ConversationMessage[];
    if (messages.length === 0) {
      throw new Error("conversation_without_messages");
    }

    return {
      conversation,
      messages,
      numericConversationId,
      numericUserId,
    };
  }

  private async getLatestValidReportForConversation({
    userId,
    conversationId,
  }: {
    userId: number;
    conversationId: number;
  }) {
    if (!this.reportsRepository) {
      return null;
    }

    const conversation =
      await this.reportsRepository.findConversationByIdForUser(
        conversationId,
        userId,
      );
    if (!conversation) {
      return null;
    }

    const latestReport =
      await this.reportsRepository.findLatestReportByConversationForUser(
        conversationId,
        userId,
      );

    if (!this.isReportUpToDate(conversation, latestReport)) {
      return null;
    }

    return latestReport;
  }

  private isReportUpToDate(
    conversation: ConversationRef | null,
    report: ReportRef | null,
  ): boolean {
    if (!conversation || !report) {
      return false;
    }

    if (conversation.status !== "completed") {
      return false;
    }

    if (!conversation.ended_at || !report.generated_at) {
      return false;
    }

    const endedAt = new Date(conversation.ended_at).getTime();
    const generatedAt = new Date(report.generated_at).getTime();

    if (!Number.isFinite(endedAt) || !Number.isFinite(generatedAt)) {
      return false;
    }

    return generatedAt >= endedAt;
  }
}
