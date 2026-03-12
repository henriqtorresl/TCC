export class ReportsService {
  constructor(reportsRepository = null) {
    this.reportsRepository = reportsRepository;
  }

  async generate({ userId, conversationId }) {
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

    const messages = await this.reportsRepository.getConversationMessages(
      numericConversationId
    );
    if (messages.length === 0) {
      throw new Error("conversation_without_messages");
    }

    const summary = messages
      .map((message) => `[${message.role}] ${message.content}`)
      .join("\n")
      .slice(0, 8000);

    return this.reportsRepository.createReport({
      userId: numericUserId,
      conversationId: numericConversationId,
      summary,
      metadata: { message_count: messages.length },
    });
  }

  async getById(reportId) {
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
}
