import { Pool } from "pg";

export class ChatRepository {
  constructor(private readonly db: Pool) {}

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

    const created = await this.db.query<{ id: number }>(
      "INSERT INTO conversations (user_id) VALUES ($1) RETURNING id;",
      [userId]
    );

    return created.rows[0].id;
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
