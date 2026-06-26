import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateReadiness,
  findFirstMatchingSnippet,
  mergeSections,
  parseAiSections,
  shouldAutoFinalizeConversation,
  ReportsService,
} from "../src/modules/reports/reports.service";

test("findFirstMatchingSnippet respects negation and still accepts positive evidence", () => {
  const negatedSignal = {
    key: "sintomas_associados",
    rejectIfNegated: true,
    positivePatterns: [/\bfebre\b/i],
  };

  const acceptedSignal = {
    key: "medicacoes_alergias",
    positivePatterns: [/\balerg/i],
    negativeEvidencePatterns: [/\bsem alergia\b/i],
  };

  assert.equal(
    findFirstMatchingSnippet(
      ["Nao tenho febre, mas tenho tosse.", "Tenho febre e dor no corpo."],
      negatedSignal as never,
    ),
    "Tenho febre e dor no corpo",
  );
  assert.equal(
    findFirstMatchingSnippet(
      ["Sem alergia conhecida.", "Alergia a penicilina."],
      acceptedSignal as never,
    ),
    "Sem alergia conhecida",
  );
});

test("parseAiSections parses raw JSON and rejects malformed output", () => {
  const parsed = parseAiSections(
    '{ "queixa_principal": "Dor no peito", "inicio_duracao": "Desde ontem", "evolucao": "Piorou hoje" }',
  );

  assert.equal(parsed?.queixa_principal, "Dor no peito");
  assert.equal(parsed?.inicio_duracao, "Desde ontem");
  assert.equal(parsed?.evolucao, "Piorou hoje");
  assert.equal(parseAiSections("{ not valid json }"), null);
});

test("mergeSections keeps base values and trims AI suggestions", () => {
  const merged = mergeSections(
    {
      queixa_principal: "Dor de cabeca",
      inicio_duracao: null,
      evolucao: null,
      fatores_melhora_piora: null,
      sintomas_associados: null,
      antecedentes: null,
      medicacoes_alergias: null,
      habitos_contexto: null,
    },
    {
      queixa_principal: "  Dor no peito  ",
      inicio_duracao: "  Desde ontem  ",
      evolucao: "  Piorou hoje  ",
    },
  );

  assert.equal(merged.queixa_principal, "Dor de cabeca");
  assert.equal(merged.inicio_duracao, "Desde ontem");
  assert.equal(merged.evolucao, "Piorou hoje");
});

test("getReportAvailability marks completed reports as downloadable only when they are current", async () => {
  const repository = {
    findConversationByIdForUser: async () => ({
      id: 8,
      status: "completed",
      ended_at: "2026-06-21T10:00:00.000Z",
    }),
    findLatestReportByConversationForUser: async () => ({
      id: 3,
      generated_at: "2026-06-21T10:05:00.000Z",
    }),
  };

  const service = new ReportsService(repository as never);

  const availability = await service.getReportAvailability({
    userId: 4,
    conversationId: 8,
  });

  assert.deepEqual(availability, {
    conversationId: 8,
    hasReport: true,
    canDownload: true,
    reportId: 3,
  });
});

test("getReportAvailability rejects invalid ids and unknown conversations", async () => {
  const repository = {
    findConversationByIdForUser: async () => null,
    findLatestReportByConversationForUser: async () => null,
  };

  const service = new ReportsService(repository as never);

  await assert.rejects(
    () =>
      service.getReportAvailability({
        userId: 0,
        conversationId: 8,
      }),
    /invalid_ids/,
  );

  await assert.rejects(
    () =>
      service.getReportAvailability({
        userId: 4,
        conversationId: 8,
      }),
    /conversation_not_found/,
  );
});

test("calculateReadiness keeps shouldAutoFinalize aligned with readiness", () => {
  const readiness = calculateReadiness({
    queixa_principal: "Dor de cabeca",
    inicio_duracao: "Desde ontem",
    evolucao: "Piorou hoje",
    fatores_melhora_piora: null,
    sintomas_associados: null,
    antecedentes: null,
    medicacoes_alergias: null,
    habitos_contexto: null,
  });

  assert.equal(readiness.is_ready, false);
  assert.equal(shouldAutoFinalizeConversation(readiness), false);
  assert.ok(readiness.missing_criteria.includes("fatores_melhora_piora"));
});
