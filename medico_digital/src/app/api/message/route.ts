import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { getSessionUserId } from "@/lib/server/auth-session";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { chatService } from "@/modules/chat/chat.container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;

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
            message: "JSON invalido no corpo da requisicao. Envie: text.",
            details: {
              requiredFields: ["text"],
            },
          },
        },
        { status: 400 },
      );
    }

    const text =
      body && typeof body === "object" && typeof (body as { text?: unknown }).text === "string"
        ? (body as { text: string }).text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        {
          error: {
            code: "required_fields_missing",
            message: "Campo obrigatorio ausente ou vazio: text.",
            details: {
              requiredFields: ["text"],
            },
          },
        },
        { status: 400 },
      );
    }

    const sessionUser = await getSessionUserId(authRepository);
    if (!sessionUser.success) {
      if (sessionUser.error === "database_not_configured") {
        return NextResponse.json({ error: sessionUser.error }, { status: 503 });
      }
      return NextResponse.json({ error: sessionUser.error }, { status: 401 });
    }

    const payload = await chatService.sendMessage({
      userId: String(sessionUser.userId),
      text,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Unhandled error in /api/message:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
