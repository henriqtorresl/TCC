import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { validateLoginBody } from "@/modules/auth/schemas";
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
              "JSON invalido no corpo da requisicao. Envie: email e password.",
            details: {
              requiredFields: ["email", "password"],
            },
          },
        },
        { status: 400 }
      );
    }

    const parsed = validateLoginBody(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const payload = await authService.login(parsed.data);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_credentials") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === "email and password are required") {
      return NextResponse.json(
        {
          error: {
            code: "required_fields_missing",
            message: "Campos obrigatorios ausentes ou vazios: email e password.",
            details: {
              requiredFields: ["email", "password"],
            },
          },
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Unhandled error in /api/auth/login:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
