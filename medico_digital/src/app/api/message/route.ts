import crypto from "node:crypto";
import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { ChatService } from "@/modules/chat/chat.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const chatRepository = db ? new ChatRepository(db) : null;
const authRepository = db ? new AuthRepository(db) : null;
const hf = new InferenceClient(env.hfToken || undefined);
const chatService = new ChatService(hf, chatRepository);

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

    if (!authRepository) {
      return NextResponse.json({ error: "database_not_configured" }, { status: 503 });
    }

    const refreshToken = (await cookies()).get("md_refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "invalid_session" }, { status: 401 });
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await authRepository.findValidSessionByRefreshTokenHash(
      refreshTokenHash,
    );

    if (!session) {
      return NextResponse.json({ error: "invalid_session" }, { status: 401 });
    }

    const payload = await chatService.sendMessage({
      userId: String(session.user_id),
      text,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Unhandled error in /api/message:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
