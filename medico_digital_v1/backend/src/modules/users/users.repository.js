export class UsersRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
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
