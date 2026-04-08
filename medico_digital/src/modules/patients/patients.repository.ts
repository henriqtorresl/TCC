import { Pool } from "pg";
import { PatientProfile, UpdatePatientInput } from "@/modules/patients/types";

export class PatientsRepository {
  constructor(private readonly db: Pool) {}

  async findByUserId(userId: number): Promise<PatientProfile | null> {
    const result = await this.db.query<PatientProfile>(
      `
      SELECT
        p.id,
        p.user_id,
        u.email,
        p.full_name,
        p.birth_date::text AS birth_date,
        p.cpf,
        p.phone,
        p.gender,
        p.created_at,
        p.updated_at
      FROM patients p
      INNER JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
      LIMIT 1;
      `,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async createForUser(userId: number): Promise<PatientProfile | null> {
    const inserted = await this.db.query(
      `
      INSERT INTO patients (user_id, full_name)
      SELECT id, full_name
      FROM users
      WHERE id = $1
      ON CONFLICT (user_id) DO NOTHING
      RETURNING user_id;
      `,
      [userId],
    );

    if (inserted.rowCount && inserted.rowCount > 0) {
      return this.findByUserId(userId);
    }

    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    return null;
  }

  async updateByUserId(
    userId: number,
    payload: UpdatePatientInput,
  ): Promise<PatientProfile | null> {
    const setClauses: string[] = [];
    const values: Array<string | null> = [];
    let index = 2;

    if (payload.fullName !== undefined) {
      setClauses.push(`full_name = $${index++}`);
      values.push(payload.fullName);
    }
    if (payload.birthDate !== undefined) {
      setClauses.push(`birth_date = $${index++}`);
      values.push(payload.birthDate);
    }
    if (payload.cpf !== undefined) {
      setClauses.push(`cpf = $${index++}`);
      values.push(payload.cpf);
    }
    if (payload.phone !== undefined) {
      setClauses.push(`phone = $${index++}`);
      values.push(payload.phone);
    }
    if (payload.gender !== undefined) {
      setClauses.push(`gender = $${index++}`);
      values.push(payload.gender);
    }

    if (setClauses.length === 0) {
      return this.findByUserId(userId);
    }

    await this.db.query(
      `
      UPDATE patients
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE user_id = $1;
      `,
      [userId, ...values],
    );

    return this.findByUserId(userId);
  }
}
