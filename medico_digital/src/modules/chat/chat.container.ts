import { InferenceClient } from "@huggingface/inference";
import { getDbPool } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { ChatService } from "@/modules/chat/chat.service";

const db = getDbPool();
const chatRepository = db ? new ChatRepository(db) : null;
const hf = new InferenceClient(env.hfToken || undefined);

export const chatService = new ChatService(hf, chatRepository);
