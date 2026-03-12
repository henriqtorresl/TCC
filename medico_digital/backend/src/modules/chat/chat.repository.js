export class ChatRepository {
  constructor(db) {
    this.db = db;
  }

  async ensureActiveConversation(userId) {
    const existing = await this.db.query(
      `
      SELECT id
      FROM conversations
      WHERE user_id = $1 AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (existing.rowCount > 0) {
      return existing.rows[0].id;
    }

    const created = await this.db.query(
      "INSERT INTO conversations (user_id) VALUES ($1) RETURNING id;",
      [userId]
    );

    return created.rows[0].id;
  }

  async saveMessage(conversationId, role, content, entities = null) {
    await this.db.query(
      `
      INSERT INTO messages (conversation_id, role, content, entities)
      VALUES ($1, $2, $3, $4);
      `,
      [conversationId, role, content, entities]
    );
  }
}
