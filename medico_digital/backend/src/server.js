import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { InferenceClient } from "@huggingface/inference";

process.loadEnvFile();

const hf = new InferenceClient(process.env.HF_TOKEN);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CHAT_MODEL = "meta-llama/Llama-3.1-8B-Instruct"; // modelo de conversa
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
    const systemPrompt = `Você é um assistente médico virtual especializado em conduzir uma anamnese.
      Seu objetivo é coletar informações como queixa principal, início, evolução, fatores de melhora/piora, antecedentes e hábitos.

      Mantenha um tom profissional,  buscando uma conversa natural, mas sem ser excessivamente seco.

      **Sua regra mais importante é: faça apenas UMA pergunta de cada vez, sempre que possível.**

      Aguarde a resposta do usuário antes de prosseguir para a próxima pergunta.
      Formule perguntas claras e objetivas para guiar o diálogo, avançando passo a passo na coleta de informações.
      Não dê diagnóstico final; seu papel é exclusivamente coletar as informações de forma sequencial.`;

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
        do_sample: true,
        temperature: 0.4,
        repetition_penalty: 1.15,
        top_p: 0.95,
      },
    });

    let botText = gen?.choices?.[0]?.message?.content || "";

    // --- INÍCIO DA LIMPEZA ROBUSTA ---

    // 1. Remove "lixo" de regex (como estava)
    botText = botText.replace(/\(\?:\n\n\)\??/g, "");

    // 2. Define padrões de metadados "lixo"
    const metadataPatterns = [
      /runs on [a-zA-Z0-9\-]{10,}[a-zA-Z0-9]*/g,
      /served by [a-zA-Z0-9\-]{10,}[a-zA-Z0-9]*/g,
      /model id: [a-zA-Z0-9\-\.]+/g,
      // Adicione outros padrões de "lixo" que você encontrar aqui
    ];

    // 3. Remove esses padrões de QUALQUER LUGAR da string
    for (const pattern of metadataPatterns) {
      botText = botText.replace(pattern, "");
    }

    // 4. Remove quebras de linha excessivas que podem ter sobrado
    //    (substitui 2 ou mais quebras de linha por apenas uma)
    botText = botText.replace(/(\n\s*){2,}/g, "\n");

    // 5. Remove espaços em branco ou quebras de linha no início/fim
    botText = botText.trim();

    // --- FIM DA LIMPEZA ---

    // Agora salve o texto limpo
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
