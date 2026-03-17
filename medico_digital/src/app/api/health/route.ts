import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDbPool();
  return NextResponse.json({
    status: "ok",
    database: db ? "configured" : "not_configured",
  });
}
