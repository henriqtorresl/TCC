import express from "express";
import bodyParser from "body-parser";
import { HfInference } from "@huggingface/inference";

process.loadEnvFile();

const hf = new HfInference(process.env.HF_TOKEN);

const app = express();
app.use(bodyParser.json());

const CHAT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"; // modelo de conversa
const NER_MODEL = "d4data/biomedical-ner-all"; // modelo de NER biomédico

// armazenamento simples de histórico (substitua por DB em produção)
const conversations = {};

app.post("/api/message", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text)
      return res.status(400).json({ error: "userId e text são obrigatórios" });

    conversations[userId] = conversations[userId] || [];
    conversations[userId].push({ role: "user", text, ts: Date.now() });

    // 1) geração de texto (chat) - monta array de mensagens para chatCompletion
    const systemPrompt = `Você é um assistente médico virtual que faz anamnese.\nFaça perguntas claras para coletar queixa principal, início, evolução, fatores de melhora/piora, antecedentes e hábitos.\nNão dê diagnóstico final; apenas colete informações.`;

    // monta histórico para o modelo
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversations[userId].slice(-10).map((m) => ({
        role: m.role,
        content: m.text,
      })),
    ];

    const gen = await hf.chatCompletion({
      model: CHAT_MODEL,
      messages,
      parameters: {
        max_new_tokens: 150,
        do_sample: false,
      },
    });

    // o retorno tem estrutura; pega o texto gerado
    const botText = gen?.choices?.[0]?.message?.content || "";
    conversations[userId].push({
      role: "assistant",
      text: botText,
      ts: Date.now(),
    });

    // 2) extrair entidades do texto do usuário com token classification (NER)
    const ner = await hf.tokenClassification({
      model: NER_MODEL,
      inputs: text,
    });
    // ner é um array de entidades: { entity, score, index, word, start, end }
    // mapeie para algo útil:
    const entities = ner.map((e) => ({
      label: e.entity,
      text: e.word,
      score: e.score,
    }));

    // Retorna resposta + entidades extraídas
    return res.json({ reply: botText, entities });
  } catch (err) {
    console.error("erro /api/message:", err);
    return res.status(500).json({ error: "erro no servidor" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("API rodando na porta", process.env.PORT || 3000);
});
