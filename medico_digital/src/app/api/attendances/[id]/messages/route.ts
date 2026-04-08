import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/auth-session";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { PatientsRepository } from "@/modules/patients/patients.repository";
import { PatientsService } from "@/modules/patients/patients.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;
const chatRepository = db ? new ChatRepository(db) : null;
const patientsRepository = db ? new PatientsRepository(db) : null;
const patientsService = new PatientsService(patientsRepository);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUserId(authRepository);
    if (!sessionUser.success) {
      if (sessionUser.error === "database_not_configured") {
        return NextResponse.json({ error: sessionUser.error }, { status: 503 });
      }
      return NextResponse.json({ error: sessionUser.error }, { status: 401 });
    }

    if (!chatRepository) {
      return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
    }

    const patient = await patientsService.getMe(sessionUser.userId);

    const { id } = await context.params;
    const numericAttendanceId = Number(id);
    if (!Number.isFinite(numericAttendanceId) || numericAttendanceId <= 0) {
      return NextResponse.json({ error: "invalid_attendance_id" }, { status: 400 });
    }

    const messages = await chatRepository.listMessagesByAttendance(
      patient.id,
      numericAttendanceId,
    );

    if (!messages) {
      return NextResponse.json({ error: "attendance_not_found" }, { status: 404 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (
      error instanceof Error &&
      error.message === "invalid_user_id"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Error &&
      (error.message === "user_not_found" || error.message === "patient_not_found")
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Unhandled error in /api/attendances/[id]/messages:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
