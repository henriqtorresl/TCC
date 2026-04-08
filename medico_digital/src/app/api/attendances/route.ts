import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/auth-session";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { ChatRepository } from "@/modules/chat/chat.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;
const chatRepository = db ? new ChatRepository(db) : null;

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

    const attendances = await chatRepository.listAttendancesByUser(sessionUser.userId);
    return NextResponse.json({ attendances });
  } catch (error) {
    console.error("Unhandled error in /api/attendances:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
