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

export async function GET() {
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
    const attendances = await chatRepository.listAttendancesByPatient(patient.id);
    return NextResponse.json({ attendances });
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
    console.error("Unhandled error in /api/attendances:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
