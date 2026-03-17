import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { ChatService } from "@/modules/chat/chat.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const chatRepository = db ? new ChatRepository(db) : null;
const hf = new InferenceClient(env.hfToken || undefined);
const chatService = new ChatService(hf, chatRepository);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = await chatService.sendMessage({
      userId: body?.userId,
      text: body?.text,
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "userId e text são obrigatórios"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Unhandled error in /api/message:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
