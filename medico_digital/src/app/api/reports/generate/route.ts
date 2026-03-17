import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { ReportsRepository } from "@/modules/reports/reports.repository";
import { ReportsService } from "@/modules/reports/reports.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const reportsRepository = db ? new ReportsRepository(db) : null;
const reportsService = new ReportsService(reportsRepository);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = await reportsService.generate({
      userId: body?.userId,
      conversationId: body?.conversationId,
    });
    return NextResponse.json(payload, { status: 201 });
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
    console.error("Unhandled error in /api/reports/generate:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
