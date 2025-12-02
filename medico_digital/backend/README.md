# 🩺 Chat-Example — Assistente Médico Digital

Este projeto é um exemplo de integração Node.js com modelos Hugging Face para realizar anamnese médica via chat.

## Requisitos

- Node.js >= 18
- Conta e token de acesso Hugging Face
- Dependências listadas no `package.json`

## Instalação e Execução

1. Instale as dependências:
   ```sh
   cd tests/chat-example
   npm install
   ```
2. Crie um arquivo `.env` com seu token Hugging Face:
   ```env
   HF_TOKEN=seu_token_aqui
   ```
3. Inicie o servidor:
   ```sh
   npm start
   ```
4. Acesse a API em `http://localhost:3000/api/message`

## Exemplo de Uso

Envie uma requisição POST para `/api/message`:

```json
{
  "userId": "123",
  "text": "Olá, estou com dor de cabeça há 2 dias."
}
```

Resposta:

```json
{
  "reply": "Pode me contar se a dor começou de repente ou foi aumentando aos poucos?",
  "entities": [
    { "label": "Symptom", "text": "dor de cabeça", "score": 0.98 },
    { "label": "Duration", "text": "2 dias", "score": 0.95 }
  ]
}
```

## Estrutura

- `src/server.js` — Código principal do servidor Express
- `.env` — Token Hugging Face
- `package.json` — Dependências do projeto

## Links Úteis

- [Documentação Hugging Face Inference](https://huggingface.co/docs/inference)
- [Modelos utilizados](https://huggingface.co/models)
- [Express.js](https://expressjs.com/pt/)

---
