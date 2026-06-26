import assert from "node:assert/strict";
import test from "node:test";

import { ChatService } from "../src/modules/chat/chat.service";

type RecordedMessage = {
  role: string;
  content: string;
};

function createAiClient(replyText: string) {
  const state = {
    lastMessages: [] as RecordedMessage[],
    chatCompletionCalls: 0,
    tokenClassificationCalls: 0,
  };

  return {
    state,
    client: {
      chatCompletion: async ({ messages }: { messages: RecordedMessage[] }) => {
        state.chatCompletionCalls += 1;
        state.lastMessages = messages;
        return {
          choices: [
            {
              message: {
                content: replyText,
              },
            },
          ],
        };
      },
      tokenClassification: async () => {
        state.tokenClassificationCalls += 1;
        return [];
      },
    },
  };
}

test("sendMessage keeps working when auto-finalization assessment fails", async () => {
  const ai = createAiClient("Claro. Qual a próxima informação?");
  const savedCalls: unknown[][] = [];

  const repository = {
    ensureActiveConversation: async () => 11,
    listMessagesByConversationId: async () => [],
    saveMessage: async (...args: unknown[]) => {
      savedCalls.push(args);
    },
  };

  const reportsService = {
    assessConversation: async () => {
      throw new Error("assessment_failed");
    },
  };

  const service = new ChatService(
    ai.client as never,
    repository as never,
    reportsService as never,
  );

  const response = await service.sendMessage({
    patientId: "7",
    text: "Tenho tosse e febre.",
    userId: 7,
  });

  assert.deepEqual(response, {
    reply: "Claro. Qual a próxima informação?",
    entities: [],
    conversationId: 11,
  });
  assert.equal(ai.state.chatCompletionCalls, 1);
  assert.equal(ai.state.tokenClassificationCalls, 1);
  assert.deepEqual(savedCalls, [
    [11, "user", "Tenho tosse e febre."],
    [11, "assistant", "Claro. Qual a próxima informação?", []],
  ]);
});

test("sendMessage sanitizes provider metadata before persisting the assistant reply", async () => {
  const ai = createAiClient(
    "Claro.\n\nserved by abcdefghijk\nruns on lmnopqrstuv",
  );
  const savedCalls: unknown[][] = [];

  const repository = {
    ensureActiveConversation: async () => 22,
    listMessagesByConversationId: async () => [],
    saveMessage: async (...args: unknown[]) => {
      savedCalls.push(args);
    },
  };

  const service = new ChatService(ai.client as never, repository as never);

  const response = await service.sendMessage({
    patientId: "9",
    text: "Tenho dor no peito.",
    userId: 4,
  });

  assert.deepEqual(response, {
    reply: "Claro.",
    entities: [],
    conversationId: 22,
  });
  assert.deepEqual(savedCalls, [
    [22, "user", "Tenho dor no peito."],
    [22, "assistant", "Claro.", []],
  ]);
});

test("listAttendances normalizes pagination and validates date ranges", async () => {
  const calls: unknown[][] = [];

  const repository = {
    listAttendancesByPatientPaginated: async (
      patientId: number,
      query: unknown,
    ) => {
      calls.push([patientId, query]);
      return {
        attendances: [{ id: 1, status: "active" }],
        total: 51,
      };
    },
  };

  const service = new ChatService({} as never, repository as never);

  const result = await service.listAttendances("9", {
    page: "2.7",
    pageSize: "200",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
  });

  assert.deepEqual(result.pagination, {
    page: 2,
    pageSize: 50,
    total: 51,
    totalPages: 2,
  });
  assert.deepEqual(result.filters, {
    dateFrom: "2026-06-01",
    dateTo: "2026-06-30",
  });
  assert.deepEqual(calls, [
    [
      9,
      {
        page: 2,
        pageSize: 50,
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
      },
    ],
  ]);

  await assert.rejects(
    () =>
      service.listAttendances("9", {
        dateFrom: "2026-06-30",
        dateTo: "2026-06-01",
      }),
    /invalid_date_range/,
  );
});
