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

type AttendanceRow = {
  id: number;
  status: string;
  ended_at: string | null;
};

type ListAttendancesOptions = {
  page: number;
  pageSize: number;
  dateFrom: string | null;
  dateTo: string | null;
};

type AttendanceListResult = {
  attendances: AttendanceSummaryRow[];
  total: number;
};

export class ChatRepository {
  constructor(private readonly db: Pool) {}

  async createConversation(patientId: number): Promise<number> {
    const created = await this.db.query<{ id: number }>(
      `
      INSERT INTO conversations (user_id, patient_id)
      SELECT user_id, id
      FROM patients
      WHERE id = $1
      RETURNING id;
      `,
      [patientId]
    );

    if (!created.rows[0]) {
      throw new Error("patient_not_found");
    }

    return created.rows[0].id;
  }

  async ensureActiveConversation(patientId: number): Promise<number> {
    const existing = await this.db.query<{ id: number }>(
      `
      SELECT id
      FROM conversations
      WHERE patient_id = $1 AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [patientId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return existing.rows[0].id;
    }

    return this.createConversation(patientId);
  }

  async closeLatestActiveConversation(patientId: number): Promise<number | null> {
    const result = await this.db.query<{ id: number }>(
      `
      WITH latest_active AS (
        SELECT id
        FROM conversations
        WHERE patient_id = $1 AND status = 'active'
        ORDER BY started_at DESC
        LIMIT 1
      )
      UPDATE conversations
      SET status = 'completed', ended_at = NOW()
      WHERE id IN (SELECT id FROM latest_active)
      RETURNING id;
      `,
      [patientId]
    );

    return result.rows[0]?.id ?? null;
  }

  async listAttendancesByPatient(patientId: number): Promise<AttendanceSummaryRow[]> {
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
      WHERE c.patient_id = $1
      GROUP BY c.id
      ORDER BY c.started_at DESC;
      `,
      [patientId],
    );

    return result.rows;
  }

  async listAttendancesByPatientPaginated(
    patientId: number,
    options: ListAttendancesOptions,
  ): Promise<AttendanceListResult> {
    const whereConditions: string[] = ["c.patient_id = $1"];
    const values: Array<number | string> = [patientId];
    let nextIndex = 2;

    if (options.dateFrom) {
      whereConditions.push(`c.started_at::date >= $${nextIndex}`);
      values.push(options.dateFrom);
      nextIndex += 1;
    }

    if (options.dateTo) {
      whereConditions.push(`c.started_at::date <= $${nextIndex}`);
      values.push(options.dateTo);
      nextIndex += 1;
    }

    const whereClause = whereConditions.join(" AND ");
    const limitParam = nextIndex;
    const offsetParam = nextIndex + 1;
    const offset = (options.page - 1) * options.pageSize;

    values.push(options.pageSize, offset);

    const [listResult, countResult] = await Promise.all([
      this.db.query<AttendanceSummaryRow>(
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
        WHERE ${whereClause}
        GROUP BY c.id
        ORDER BY c.started_at DESC
        LIMIT $${limitParam}
        OFFSET $${offsetParam};
        `,
        values,
      ),
      this.db.query<{ total: string }>(
        `
        SELECT COUNT(*)::text AS total
        FROM conversations c
        WHERE ${whereClause};
        `,
        values.slice(0, limitParam - 1),
      ),
    ]);

    return {
      attendances: listResult.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async listMessagesByAttendance(
    patientId: number,
    attendanceId: number,
  ): Promise<AttendanceMessageRow[] | null> {
    const attendance = await this.db.query<{ id: number }>(
      `
      SELECT id
      FROM conversations
      WHERE id = $1 AND patient_id = $2
      LIMIT 1;
      `,
      [attendanceId, patientId],
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

  async findAttendanceById(
    patientId: number,
    attendanceId: number,
  ): Promise<AttendanceRow | null> {
    const result = await this.db.query<AttendanceRow>(
      `
      SELECT id, status, ended_at
      FROM conversations
      WHERE id = $1 AND patient_id = $2
      LIMIT 1;
      `,
      [attendanceId, patientId],
    );

    return result.rows[0] ?? null;
  }

  async closeAttendanceById(
    patientId: number,
    attendanceId: number,
  ): Promise<AttendanceRow | null> {
    const result = await this.db.query<AttendanceRow>(
      `
      UPDATE conversations
      SET status = 'completed', ended_at = NOW()
      WHERE id = $1
        AND patient_id = $2
        AND status = 'active'
      RETURNING id, status, ended_at;
      `,
      [attendanceId, patientId],
    );

    return result.rows[0] ?? null;
  }

  async reopenAttendanceById(
    patientId: number,
    attendanceId: number,
  ): Promise<AttendanceRow | null> {
    const result = await this.db.query<AttendanceRow>(
      `
      UPDATE conversations
      SET status = 'active', ended_at = NULL
      WHERE id = $1
        AND patient_id = $2
        AND status <> 'active'
      RETURNING id, status, ended_at;
      `,
      [attendanceId, patientId],
    );

    return result.rows[0] ?? null;
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
