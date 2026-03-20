import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/server/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildOpenApiSpec());
}
