import fs from "node:fs/promises";
import path from "node:path";
import ejs from "ejs";
import { chromium } from "playwright";
import { ReportsRepository } from "@/modules/reports/reports.repository";

const REQUIRED_CRITERIA_SCORE = 7;

type ConversationMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
};

type ReportCriterionKey =
  | "queixa_principal"
  | "inicio_duracao"
  | "evolucao"
  | "fatores_melhora_piora"
  | "sintomas_associados"
  | "antecedentes"
  | "medicacoes_alergias"
  | "habitos_contexto";

type ReportReadiness = {
  is_ready: boolean;
  score: number;
  required_score: number;
  criteria: Record<ReportCriterionKey, boolean>;
  missing_criteria: ReportCriterionKey[];
};

type ConversationSections = {
  queixa_principal: string | null;
  inicio_duracao: string | null;
  evolucao: string | null;
  fatores_melhora_piora: string | null;
  sintomas_associados: string | null;
  antecedentes: string | null;
  medicacoes_alergias: string | null;
  habitos_contexto: string | null;
};

type ConversationMetadata = {
  message_count: number;
  user_message_count: number;
  assistant_message_count: number;
  readiness: ReportReadiness;
  sections: ConversationSections;
  generation: {
    strategy: "rule_based_v1";
    generated_at: string;
  };
};

type ConversationSignal = {
  key: ReportCriterionKey;
  patterns: RegExp[];
};

type ConversationRef = {
  status: string;
  ended_at: string | null;
};

type ReportRef = {
  id: number | string;
  generated_at: string;
};

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
    patterns: [
      /dor|febre|tosse|falta de ar|dispneia|nausea|náusea|vomit|diarreia|tontura|cansa[cç]o|palpita[cç][aã]o|inch[aã]co/i,
    ],
  },
  {
    key: "inicio_duracao",
    patterns: [
      /desde|h[áa]\s*\d+\s*(hora|horas|dia|dias|semana|semanas|m[eê]s|meses|ano|anos)/i,
      /come[cç]ou|in[ií]cio|dura[cç][aã]o|h[aá] tempo/i,
    ],
  },
  {
    key: "evolucao",
    patterns: [/piorou|melhorou|est[aá]vel|progressiv|evolu[cç][aã]o/i],
  },
  {
    key: "fatores_melhora_piora",
    patterns: [
      /piora com|melhora com|piora ao|melhora ao|alivia com|agrava com/i,
    ],
  },
  {
    key: "sintomas_associados",
    patterns: [
      /al[eé]m disso|tamb[eé]m estou|sintomas associados|outro sintoma|junto com/i,
    ],
  },
  {
    key: "antecedentes",
    patterns: [
      /hiperten|diabet|asma|card[ií]ac|cirurg|interna[cç][aã]o|antecedente|hist[oó]rico familiar/i,
      /n[aã]o tenho doen[cç]a cr[oô]nica|sem antecedente/i,
    ],
  },
  {
    key: "medicacoes_alergias",
    patterns: [
      /tomo|uso|medica[cç][aã]o|rem[eé]dio|alergia|sou al[eé]rgic|n[aã]o tenho alergia/i,
    ],
  },
  {
    key: "habitos_contexto",
    patterns: [
      /fumo|tabag|cigarro|[aá]lcool|bebida|drogas?|atividade f[ií]sica|sedent[aá]rio|sono|trabalho/i,
    ],
  },
];

export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository | null = null,
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

    const sections = this.extractSections(messages);
    const readiness = this.calculateReadiness(sections);

    return {
      conversationId: numericConversationId,
      conversationStatus: conversation.status,
      messageCount: messages.length,
      readiness,
      sections,
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

    const sections = this.extractSections(messages);
    const readiness = this.calculateReadiness(sections);

    if (!readiness.is_ready && !allowIncomplete) {
      throw new Error(
        `conversation_not_ready:${readiness.missing_criteria.join(",")}`,
      );
    }

    const summary = this.buildSummary({
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
        strategy: "rule_based_v1",
        generated_at: new Date().toISOString(),
      },
    };

    return this.reportsRepository.createReport({
      userId: numericUserId,
      conversationId: numericConversationId,
      summary,
      metadata,
    });
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

    const conversation = await this.reportsRepository.findConversationByIdForUser(
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

    const templatePath = path.join(
      process.cwd(),
      "public",
      "assets",
      "report-template.ejs",
    );

    let html: string;
    try {
      const template = await fs.readFile(templatePath, "utf8");
      html = ejs.render(template, {
        report,
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
      });
    } catch {
      throw new Error("report_template_render_failed");
    }

    try {
      const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "12mm",
          right: "10mm",
          bottom: "12mm",
          left: "10mm",
        },
      });
      await browser.close();

      return {
        pdf,
        reportId: numericReportId,
        conversationId: Number(report.conversation_id),
      };
    } catch {
      throw new Error("report_pdf_generation_failed");
    }
  }

  private extractSections(
    messages: ConversationMessage[],
  ): ConversationSections {
    const userMessages = messages
      .filter((message) => message.role === "user")
      .map((message) => this.normalizeSpaces(message.content));

    const sections = {
      queixa_principal: null,
      inicio_duracao: null,
      evolucao: null,
      fatores_melhora_piora: null,
      sintomas_associados: null,
      antecedentes: null,
      medicacoes_alergias: null,
      habitos_contexto: null,
    } as ConversationSections;

    for (const signal of CONVERSATION_SIGNALS) {
      sections[signal.key] = this.findFirstMatchingSnippet(
        userMessages,
        signal.patterns,
      );
    }

    return sections;
  }

  private calculateReadiness(sections: ConversationSections): ReportReadiness {
    const criteria = {
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

  private buildSummary({
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

  private findFirstMatchingSnippet(
    messages: string[],
    patterns: RegExp[],
  ): string | null {
    const matched = messages.find((message) =>
      patterns.some((pattern) => pattern.test(message)),
    );

    return matched ? matched.slice(0, 280) : null;
  }

  private normalizeSpaces(value: string): string {
    return value.replace(/\s+/g, " ").trim();
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

    const conversation = await this.reportsRepository.findConversationByIdForUser(
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
