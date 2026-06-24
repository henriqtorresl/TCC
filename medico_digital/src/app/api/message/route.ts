import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { InferenceClient } from "@huggingface/inference";
import { env } from "@/lib/server/env";
import { getSessionUserId } from "@/lib/server/auth-session";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { ChatService } from "@/modules/chat/chat.service";
import { ReportsRepository } from "@/modules/reports/reports.repository";
import { ReportsService } from "@/modules/reports/reports.service";
import { PatientsRepository } from "@/modules/patients/patients.repository";
import { PatientsService } from "@/modules/patients/patients.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;
const patientsRepository = db ? new PatientsRepository(db) : null;
const patientsService = new PatientsService(patientsRepository);
const chatRepository = db ? new ChatRepository(db) : null;
const hf = new InferenceClient(env.hfToken || undefined);
const reportsRepository = db ? new ReportsRepository(db) : null;
const reportsService = new ReportsService(reportsRepository, hf);
const chatService = new ChatService(hf, chatRepository, reportsService);

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
      body &&
      typeof body === "object" &&
      typeof (body as { text?: unknown }).text === "string"
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

    const patient = await patientsService.getMe(sessionUser.userId);

    const payload = await chatService.sendMessage(
      {
        patientId: String(patient.id),
        text,
      },
      sessionUser,
    );

    return NextResponse.json({
      ...payload,
      automation: {
        autoFinalized: payload.autoFinalized ?? false,
        conversationId: payload.conversationId ?? null,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "patientId e text são obrigatórios" ||
        error.message === "required_fields_missing")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "invalid_user_id") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Error &&
      (error.message === "user_not_found" ||
        error.message === "patient_not_found")
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Unhandled error in /api/message:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}
