import assert from "node:assert/strict";
import test from "node:test";

import { ChatService } from "../src/modules/chat/chat.service";

type RecordedMessage = {
  role: string;
  content: string;
};

function createAiClient() {
  const state = {
    lastMessages: [] as RecordedMessage[],
  };

  return {
    state,
    client: {
      chatCompletion: async ({ messages }: { messages: RecordedMessage[] }) => {
        state.lastMessages = messages;
        return {
          choices: [
            {
              message: {
                content: "Claro. Qual a próxima informação?",
              },
            },
          ],
        };
      },
      tokenClassification: async () => [],
    },
  };
}

test("sendMessage reuses the persisted conversation context when it exists", async () => {
  const ai = createAiClient();
  const savedMessages = [
    {
      id: 1,
      role: "user" as const,
      content: "Estou com dor de cabeca desde ontem.",
      created_at: "2026-06-21T10:00:00.000Z",
    },
    {
      id: 2,
      role: "assistant" as const,
      content: "Entendi. A dor piora com algum movimento?",
      created_at: "2026-06-21T10:00:05.000Z",
    },
  ];
  const savedCalls: Array<[number, string, string]> = [];

  const repository = {
    findLatestActiveConversationId: async () => 42,
    listMessagesByConversationId: async () => savedMessages,
    ensureActiveConversation: async () => 42,
    saveMessage: async (conversationId: number, role: string, content: string) => {
      savedCalls.push([conversationId, role, content]);
    },
  };

  const service = new ChatService(ai.client as never, repository as never);

  const response = await service.sendMessage({
    patientId: "7",
    text: "Agora tambem sinto enjoo.",
  });

  assert.equal(response.reply, "Claro. Qual a próxima informação?");
  assert.deepEqual(
    ai.state.lastMessages.map(({ role, content }) => ({ role, content })),
    [
      {
        role: "system",
        content:
          "Você é um assistente médico virtual especializado em conduzir uma anamnese.\nSeu objetivo é coletar informações como queixa principal, início, evolução, fatores de melhora/piora, antecedentes e hábitos.\n\nMantenha um tom profissional, buscando uma conversa natural, mas sem ser excessivamente seco.\n\nSua regra mais importante é: faça apenas UMA pergunta de cada vez, sempre que possível.\n\nAguarde a resposta do usuário antes de prosseguir para a próxima pergunta.\nFormule perguntas claras e objetivas para guiar o diálogo, avançando passo a passo na coleta de informações.\nNão dê diagnóstico final; seu papel é exclusivamente coletar as informações de forma sequencial.",
      },
      {
        role: "user",
        content: "Estou com dor de cabeca desde ontem.",
      },
      {
        role: "assistant",
        content: "Entendi. A dor piora com algum movimento?",
      },
      {
        role: "user",
        content: "Agora tambem sinto enjoo.",
      },
    ],
  );
  assert.deepEqual(savedCalls, [
    [42, "user", "Agora tambem sinto enjoo."],
    [42, "assistant", "Claro. Qual a próxima informação?"],
  ]);
});

test("sendMessage does not inject history when the database has no saved messages", async () => {
  const ai = createAiClient();
  const repository = {
    findLatestActiveConversationId: async () => 99,
    listMessagesByConversationId: async () => [],
    ensureActiveConversation: async () => 99,
    saveMessage: async () => undefined,
  };

  const service = new ChatService(ai.client as never, repository as never);

  await service.sendMessage({
    patientId: "7",
    text: "Tenho febre e dor no corpo.",
  });

  assert.deepEqual(
    ai.state.lastMessages.map(({ role, content }) => ({ role, content })),
    [
      {
        role: "system",
        content:
          "Você é um assistente médico virtual especializado em conduzir uma anamnese.\nSeu objetivo é coletar informações como queixa principal, início, evolução, fatores de melhora/piora, antecedentes e hábitos.\n\nMantenha um tom profissional, buscando uma conversa natural, mas sem ser excessivamente seco.\n\nSua regra mais importante é: faça apenas UMA pergunta de cada vez, sempre que possível.\n\nAguarde a resposta do usuário antes de prosseguir para a próxima pergunta.\nFormule perguntas claras e objetivas para guiar o diálogo, avançando passo a passo na coleta de informações.\nNão dê diagnóstico final; seu papel é exclusivamente coletar as informações de forma sequencial.",
      },
      {
        role: "user",
        content: "Tenho febre e dor no corpo.",
      },
    ],
  );
});
