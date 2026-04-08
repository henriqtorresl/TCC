import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/auth-session";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { chatService } from "@/modules/chat/chat.container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;

export async function POST() {
  try {
    const sessionUser = await getSessionUserId(authRepository);
    if (!sessionUser.success) {
      if (sessionUser.error === "database_not_configured") {
        return NextResponse.json({ error: sessionUser.error }, { status: 503 });
      }
      return NextResponse.json({ error: sessionUser.error }, { status: 401 });
    }

    const payload = await chatService.startNewAttendance(
      String(sessionUser.userId),
    );
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "invalid_user_id") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Unhandled error in /api/message/attendance/start:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
