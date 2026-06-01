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

    const { id } = await context.params;
    const payload = await reportsService.generatePdfById({
      reportId: id,
      userId: sessionUser.userId,
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "invalid_ids") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Error &&
      (error.message === "report_not_found" ||
        error.message === "conversation_not_found")
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Unhandled error in /api/reports/[id]/download:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
