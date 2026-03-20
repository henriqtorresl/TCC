import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { validateRegisterBody } from "@/modules/auth/schemas";
import { AuthService } from "@/modules/auth/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;
const authService = new AuthService(authRepository);

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "invalid_json_body",
            message:
              "JSON invalido no corpo da requisicao. Envie: fullName, email e password.",
            details: {
              requiredFields: ["fullName", "email", "password"],
            },
          },
        },
        { status: 400 }
      );
    }

    const parsed = validateRegisterBody(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const payload = await authService.register(parsed.data);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "email_already_in_use"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Unhandled error in /api/auth/register:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
