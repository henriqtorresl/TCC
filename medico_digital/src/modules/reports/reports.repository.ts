import { Pool } from "pg";
import { GenerateReportInput } from "@/modules/reports/types";
import type { ConversationMetadata } from "@/modules/reports/types";

export class ReportsRepository {
  constructor(private readonly db: Pool) {}

  async findConversationWithPatientByIdForUser(
    conversationId: number,
    userId: number,
  ) {
    const result = await this.db.query(
      `
      SELECT
        c.id,
        c.status,
        c.started_at,
        c.ended_at,
        p.id AS patient_id,
        p.full_name AS patient_full_name
      FROM conversations c
      LEFT JOIN patients p ON p.id = c.patient_id
      WHERE c.id = $1
        AND c.user_id = $2
      LIMIT 1;
      `,
      [conversationId, userId],
    );

    return result.rows[0] ?? null;
  }

  async findConversationByIdForUser(conversationId: number, userId: number) {
    const result = await this.db.query(
      `
      SELECT id, status, started_at, ended_at
      FROM conversations
      WHERE id = $1 AND user_id = $2
      LIMIT 1;
      `,
      [conversationId, userId]
    );
    return result.rows[0] ?? null;
  }

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
  }: GenerateReportInput & { summary: string; metadata: ConversationMetadata }) {
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

  async findLatestReportByConversationForUser(
    conversationId: number,
    userId: number,
  ) {
    const result = await this.db.query(
      `
      SELECT id, user_id, conversation_id, summary, status, metadata, generated_at
      FROM reports
      WHERE conversation_id = $1
        AND user_id = $2
      ORDER BY generated_at DESC
      LIMIT 1;
      `,
      [conversationId, userId],
    );

    return result.rows[0] ?? null;
  }
}
