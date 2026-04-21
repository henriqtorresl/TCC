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

export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUserId(authRepository);
    if (!sessionUser.success) {
      if (sessionUser.error === "database_not_configured") {
        return NextResponse.json({ error: sessionUser.error }, { status: 503 });
      }
      return NextResponse.json({ error: sessionUser.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    const payload = await reportsService.assessConversation({
      userId: sessionUser.userId,
      conversationId: Number(conversationId),
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (
      error instanceof Error &&
      (error.message === "invalid_ids" ||
        error.message === "conversation_without_messages")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "conversation_not_found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Unhandled error in /api/reports/readiness:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
