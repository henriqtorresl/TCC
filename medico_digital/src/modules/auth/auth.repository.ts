import { Pool } from "pg";

type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
};

type CreateSessionInput = {
  userId: number;
  refreshTokenHash: string;
  expiresAt: Date;
};

export class AuthRepository {
  constructor(private readonly db: Pool) {}

  async createUser({ fullName, email, passwordHash }: CreateUserInput) {
    const result = await this.db.query(
      `
      INSERT INTO users (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, role, created_at;
      `,
      [fullName, email, passwordHash]
    );
    return result.rows[0];
  }

  async findUserByEmail(email: string) {
    const result = await this.db.query(
      `
      SELECT id, full_name, email, role, password_hash
      FROM users
      WHERE email = $1
      LIMIT 1;
      `,
      [email]
    );
    return result.rows[0] ?? null;
  }

  async createSession({ userId, refreshTokenHash, expiresAt }: CreateSessionInput) {
    const result = await this.db.query(
      `
      INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at, created_at;
      `,
      [userId, refreshTokenHash, expiresAt]
    );
    return result.rows[0];
  }
}
