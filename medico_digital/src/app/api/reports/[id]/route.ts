import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { ReportsRepository } from "@/modules/reports/reports.repository";
import { ReportsService } from "@/modules/reports/reports.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const reportsRepository = db ? new ReportsRepository(db) : null;
const reportsService = new ReportsService(reportsRepository);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = await reportsService.getById(id);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "invalid_report_id") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "report_not_found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Unhandled error in /api/reports/[id]:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
