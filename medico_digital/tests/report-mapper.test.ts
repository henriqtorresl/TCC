import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSummary,
  calculateReadiness,
  extractSections,
  shouldAutoFinalizeConversation,
} from "../src/modules/reports/reports.service";
import type { ConversationMessage } from "../src/modules/reports/types";

test("extractSections identifies the main clinical fields", () => {
  const messages: ConversationMessage[] = [
    {
      role: "user",
      content:
        "Estou com dor de cabeca desde ontem e piorou hoje. Melhora quando descanso.",
      created_at: "2026-06-21T10:00:00.000Z",
    },
    {
      role: "assistant",
      content: "Entendi. Tem mais algum sintoma?",
      created_at: "2026-06-21T10:00:05.000Z",
    },
    {
      role: "user",
      content:
        "Tambem tenho tosse e febre. Sem antecedentes. Nao uso medicacao e nao tenho alergia. Trabalho sentado e nao pratico atividade fisica.",
      created_at: "2026-06-21T10:00:10.000Z",
    },
  ];

  const sections = extractSections(messages);

  assert.equal(
    sections.queixa_principal,
    "Estou com dor de cabeca desde ontem e piorou hoje",
  );
  assert.equal(
    sections.inicio_duracao,
    "Estou com dor de cabeca desde ontem e piorou hoje",
  );
  assert.equal(
    sections.evolucao,
    "Estou com dor de cabeca desde ontem e piorou hoje",
  );
  assert.equal(sections.fatores_melhora_piora, "Melhora quando descanso");
  assert.equal(sections.sintomas_associados, "Tambem tenho tosse e febre");
  assert.equal(sections.antecedentes, "Sem antecedentes");
  assert.equal(sections.medicacoes_alergias, "Nao uso medicacao e nao tenho alergia");
  assert.equal(
    sections.habitos_contexto,
    "Trabalho sentado e nao pratico atividade fisica",
  );
});

test("calculateReadiness marks a complete conversation as ready", () => {
  const sections = {
    queixa_principal: "Dor de cabeca",
    inicio_duracao: "Desde ontem",
    evolucao: "Piorou hoje",
    fatores_melhora_piora: "Melhora com descanso",
    sintomas_associados: "Tosse e febre",
    antecedentes: "Sem antecedentes",
    medicacoes_alergias: "Nao uso medicacao e nao tenho alergia",
    habitos_contexto: "Trabalho e atividade fisica",
  };

  const readiness = calculateReadiness(sections);

  assert.equal(readiness.is_ready, true);
  assert.equal(shouldAutoFinalizeConversation(readiness), true);
  assert.equal(readiness.score, 8);
  assert.equal(readiness.missing_criteria.length, 0);
});

test("calculateReadiness keeps incomplete conversations open", () => {
  const sections = {
    queixa_principal: "Dor abdominal",
    inicio_duracao: null,
    evolucao: null,
    fatores_melhora_piora: null,
    sintomas_associados: null,
    antecedentes: null,
    medicacoes_alergias: null,
    habitos_contexto: null,
  };

  const readiness = calculateReadiness(sections);

  assert.equal(readiness.is_ready, false);
  assert.equal(shouldAutoFinalizeConversation(readiness), false);
  assert.ok(readiness.missing_criteria.includes("inicio_duracao"));
  assert.ok(readiness.missing_criteria.includes("medicacoes_alergias"));
});

test("buildSummary includes the detected fields and pending criteria", () => {
  const sections = {
    queixa_principal: "Dor de cabeca",
    inicio_duracao: "Desde ontem",
    evolucao: null,
    fatores_melhora_piora: null,
    sintomas_associados: null,
    antecedentes: null,
    medicacoes_alergias: null,
    habitos_contexto: null,
  };
  const readiness = calculateReadiness(sections);

  const summary = buildSummary({
    conversationId: 42,
    sections,
    readiness,
    messages: [
      {
        role: "user",
        content: "Dor de cabeca desde ontem",
        created_at: "2026-06-21T10:00:00.000Z",
      },
    ],
  });

  assert.match(summary, /Atendimento #42/);
  assert.match(summary, /Queixa principal: Dor de cabeca/);
  assert.match(summary, /Pend[eê]ncias:/);
});
