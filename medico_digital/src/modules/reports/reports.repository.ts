import { Pool } from "pg";
import { GenerateReportInput } from "@/modules/reports/types";

export class ReportsRepository {
  constructor(private readonly db: Pool) {}

  async getConversationMessages(conversationId: number) {
    const result = await this.db.query(
      `
      SELECT role, content, entities, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC;
      `,
      [conversationId]
    );
    return result.rows;
  }

  async createReport({
    userId,
    conversationId,
    summary,
    metadata,
  }: GenerateReportInput & { summary: string; metadata: unknown }) {
    const result = await this.db.query(
      `
      INSERT INTO reports (user_id, conversation_id, summary, status, metadata)
      VALUES ($1, $2, $3, 'draft', $4)
      RETURNING id, user_id, conversation_id, summary, status, metadata, generated_at;
      `,
      [userId, conversationId, summary, metadata]
    );
    return result.rows[0];
  }

  async findReportById(reportId: number) {
    const result = await this.db.query(
      `
      SELECT id, user_id, conversation_id, summary, status, metadata, generated_at
      FROM reports
      WHERE id = $1
      LIMIT 1;
      `,
      [reportId]
    );
    return result.rows[0] ?? null;
  }
}
