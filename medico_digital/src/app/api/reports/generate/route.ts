import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/auth-session";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { ReportsRepository } from "@/modules/reports/reports.repository";
import { ReportsService } from "@/modules/reports/reports.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;
const reportsRepository = db ? new ReportsRepository(db) : null;
const reportsService = new ReportsService(reportsRepository);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionUser = await getSessionUserId(authRepository);
    if (!sessionUser.success) {
      if (sessionUser.error === "database_not_configured") {
        return NextResponse.json({ error: sessionUser.error }, { status: 503 });
      }
      return NextResponse.json({ error: sessionUser.error }, { status: 401 });
    }

    const payload = await reportsService.generate({
      userId: sessionUser.userId,
      conversationId: body?.conversationId,
      allowIncomplete: body?.allowIncomplete === true,
    });
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (
      error instanceof Error &&
      (error.message === "invalid_ids" ||
        error.message === "conversation_not_found" ||
        error.message === "conversation_not_completed" ||
        error.message === "conversation_without_messages")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Error &&
      error.message.startsWith("conversation_not_ready:")
    ) {
      const missing = error.message
        .replace("conversation_not_ready:", "")
        .split(",")
        .filter(Boolean);

      return NextResponse.json(
        {
          error: "conversation_not_ready",
          details: { missingCriteria: missing },
        },
        { status: 400 },
      );
    }
    console.error("Unhandled error in /api/reports/generate:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
