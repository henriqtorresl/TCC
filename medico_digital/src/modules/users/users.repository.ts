import { Pool } from "pg";

export class UsersRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: number) {
    const result = await this.db.query(
      `
      SELECT id, full_name, email, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
      `,
      [id]
    );
    return result.rows[0] ?? null;
  }
}
