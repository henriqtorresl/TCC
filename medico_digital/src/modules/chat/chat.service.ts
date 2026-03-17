import { InferenceClient } from "@huggingface/inference";
import { ChatRepository } from "@/modules/chat/chat.repository";
import { ChatEntity, ChatRequest, ChatResponse } from "@/modules/chat/types";

const CHAT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const NER_MODEL = "d4data/biomedical-ner-all";

type ChatHistoryItem = {
  role: "user" | "assistant";
  text: string;
  ts: number;
};

export class ChatService {
  private readonly conversations: Record<string, ChatHistoryItem[]> = {};

  constructor(
    private readonly hfClient: InferenceClient,
    private readonly chatRepository: ChatRepository | null = null
  ) {}

  async sendMessage({ userId, text }: ChatRequest): Promise<ChatResponse> {
    if (!userId || !text) {
      throw new Error("userId e text são obrigatórios");
    }

    this.conversations[userId] = this.conversations[userId] ?? [];
    this.conversations[userId].push({ role: "user", text, ts: Date.now() });

    const systemPrompt = `Você é um assistente médico virtual especializado em conduzir uma anamnese.
Seu objetivo é coletar informações como queixa principal, início, evolução, fatores de melhora/piora, antecedentes e hábitos.

Mantenha um tom profissional, buscando uma conversa natural, mas sem ser excessivamente seco.

Sua regra mais importante é: faça apenas UMA pergunta de cada vez, sempre que possível.

Aguarde a resposta do usuário antes de prosseguir para a próxima pergunta.
Formule perguntas claras e objetivas para guiar o diálogo, avançando passo a passo na coleta de informações.
Não dê diagnóstico final; seu papel é exclusivamente coletar as informações de forma sequencial.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...this.conversations[userId].slice(-10).map((entry) => ({
        role: entry.role,
        content: entry.text,
      })),
    ];

    const completion = await this.hfClient.chatCompletion({
      model: CHAT_MODEL,
      messages,
      parameters: {
        max_new_tokens: 150,
        do_sample: true,
        temperature: 0.4,
        repetition_penalty: 1.15,
        top_p: 0.95,
      },
    });

    const rawBotText = completion?.choices?.[0]?.message?.content ?? "";
    const botText = this.sanitizeBotText(rawBotText);

    this.conversations[userId].push({
      role: "assistant",
      text: botText,
      ts: Date.now(),
    });

    const nerResult = await this.hfClient.tokenClassification({
      model: NER_MODEL,
      inputs: text,
    });

    const entities: ChatEntity[] = nerResult.map((entity) => ({
      label: entity.entity ?? "unknown",
      text: entity.word ?? "",
      score: entity.score ?? 0,
    }));

    await this.persistIfPossible(userId, text, botText, entities);

    return { reply: botText, entities };
  }

  private sanitizeBotText(botText: string): string {
    let value = botText.replace(/\(\?:\n\n\)\??/g, "");
    const metadataPatterns = [
      /runs on [a-zA-Z0-9\-]{10,}[a-zA-Z0-9]*/g,
      /served by [a-zA-Z0-9\-]{10,}[a-zA-Z0-9]*/g,
      /model id: [a-zA-Z0-9\-\.]+/g,
    ];

    for (const pattern of metadataPatterns) {
      value = value.replace(pattern, "");
    }

    value = value.replace(/(\n\s*){2,}/g, "\n");
    return value.trim();
  }

  private async persistIfPossible(
    userId: string,
    userText: string,
    assistantText: string,
    entities: ChatEntity[]
  ): Promise<void> {
    if (!this.chatRepository) {
      return;
    }

    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      return;
    }

    try {
      const conversationId =
        await this.chatRepository.ensureActiveConversation(numericUserId);
      await this.chatRepository.saveMessage(conversationId, "user", userText);
      await this.chatRepository.saveMessage(
        conversationId,
        "assistant",
        assistantText,
        entities
      );
    } catch (error) {
      console.warn("Could not persist chat messages:", error);
    }
  }
}
