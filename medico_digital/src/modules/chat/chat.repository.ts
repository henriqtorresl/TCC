import { Pool } from "pg";

type AttendanceSummaryRow = {
  id: number;
  title: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  last_message_at: string | null;
  message_count: string;
};

type AttendanceMessageRow = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export class ChatRepository {
  constructor(private readonly db: Pool) {}

  async createConversation(userId: number): Promise<number> {
    const created = await this.db.query<{ id: number }>(
      "INSERT INTO conversations (user_id) VALUES ($1) RETURNING id;",
      [userId]
    );

    return created.rows[0].id;
  }

  async ensureActiveConversation(userId: number): Promise<number> {
    const existing = await this.db.query<{ id: number }>(
      `
      SELECT id
      FROM conversations
      WHERE user_id = $1 AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return existing.rows[0].id;
    }

    return this.createConversation(userId);
  }

  async closeLatestActiveConversation(userId: number): Promise<number | null> {
    const result = await this.db.query<{ id: number }>(
      `
      WITH latest_active AS (
        SELECT id
        FROM conversations
        WHERE user_id = $1 AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1
      )
      UPDATE conversations
      SET status = 'completed', ended_at = NOW()
      WHERE id IN (SELECT id FROM latest_active)
      RETURNING id;
      `,
      [userId]
    );

    return result.rows[0]?.id ?? null;
  }

  async listAttendancesByUser(userId: number): Promise<AttendanceSummaryRow[]> {
    const result = await this.db.query<AttendanceSummaryRow>(
      `
      SELECT
        c.id,
        c.title,
        c.status,
        c.started_at,
        c.ended_at,
        MAX(m.created_at) AS last_message_at,
        COUNT(m.id)::text AS message_count
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.started_at DESC;
      `,
      [userId],
    );

    return result.rows;
  }

  async listMessagesByAttendance(
    userId: number,
    attendanceId: number,
  ): Promise<AttendanceMessageRow[] | null> {
    const attendance = await this.db.query<{ id: number }>(
      `
      SELECT id
      FROM conversations
      WHERE id = $1 AND user_id = $2
      LIMIT 1;
      `,
      [attendanceId, userId],
    );

    if (!attendance.rows[0]) {
      return null;
    }

    const messages = await this.db.query<AttendanceMessageRow>(
      `
      SELECT id, role, content, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC;
      `,
      [attendanceId],
    );

    return messages.rows;
  }

  async saveMessage(
    conversationId: number,
    role: "user" | "assistant" | "system",
    content: string,
    entities: unknown = null
  ): Promise<void> {
    const entitiesJson = entities === null ? null : JSON.stringify(entities);

    await this.db.query(
      `
      INSERT INTO messages (conversation_id, role, content, entities)
      VALUES ($1, $2, $3, $4);
      `,
      [conversationId, role, content, entitiesJson]
    );
  }
}
