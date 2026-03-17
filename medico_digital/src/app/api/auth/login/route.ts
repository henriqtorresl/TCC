import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { AuthService } from "@/modules/auth/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;
const authService = new AuthService(authRepository);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = await authService.login({
      email: body?.email,
      password: body?.password,
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "email and password are required" ||
        error.message === "invalid_credentials")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Unhandled error in /api/auth/login:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
