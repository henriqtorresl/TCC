# AGENTS.md

## Objetivo

Este diretório contém o código da aplicação `medico_digital`, dividida em backend e frontend.
O objetivo deste guia é permitir que qualquer agente entenda rapidamente a arquitetura atual,
faça mudanças com segurança e preserve o estágio atual do projeto: um protótipo funcional de
anamnese assistida com arquitetura híbrida `chat + NER`.

## Escopo

As instruções deste arquivo valem para todo o conteúdo dentro de `medico_digital/`.

## Estrutura do projeto

- `backend/`: API Node.js/Express que orquestra as chamadas aos modelos de IA.
- `frontend/`: aplicação React + TypeScript + Vite para interação via chat.

## Visão geral da arquitetura

O sistema atual tem dois componentes:

- `backend`:
  - recebe mensagens do usuário;
  - mantém histórico em memória por `userId`;
  - usa um modelo generativo para conduzir a conversa;
  - usa um modelo extrativo para identificar entidades biomédicas;
  - devolve `reply` e `entities` em JSON.

- `frontend`:
  - exibe o chat;
  - envia o texto do usuário para a API;
  - mostra a resposta do assistente;
  - exibe estado de carregamento;
  - hoje não explora as entidades extraídas na interface.

## Backend

### Arquivos principais

- `backend/src/server.js`: único ponto de entrada da API.
- `backend/package.json`: dependências e script de execução.
- `backend/.env`: token local do Hugging Face.
- `backend/.env.example`: exemplo de configuração.

### Stack

- Node.js 18+
- Express
- `@huggingface/inference`
- `cors`
- `body-parser`

### Comportamento atual

- Endpoint principal: `POST /api/message`
- Entrada esperada:
  - `userId`
  - `text`
- Saída:
  - `reply`
  - `entities`

### Modelos usados

- Chat:
  - `meta-llama/Llama-3.1-8B-Instruct`
- NER:
  - `d4data/biomedical-ner-all`

### Limitações atuais do backend

- O histórico é mantido apenas em memória.
- Não há autenticação.
- Não há banco de dados.
- Não há separação em camadas ou módulos.
- Não há suíte de testes automatizados local do backend principal.
- O tratamento de erros ainda é simples.

## Frontend

### Arquivos principais

- `frontend/src/App.tsx`: tela principal do chat.
- `frontend/src/service/llmService.ts`: integração HTTP com o backend.
- `frontend/src/main.tsx`: bootstrap da aplicação.
- `frontend/src/index.css`: estilos globais.

### Arquivos auxiliares

- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/sonner.tsx`
- `frontend/src/lib/utils.ts`

### Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Radix UI
- `axios`
- `sonner`
- `lucide-react`

### Comportamento atual

- Há uma única tela de chat.
- O serviço HTTP usa `http://localhost:3000`.
- O `userId` está fixo como `"1"` no cliente.
- A interface mostra mensagens do usuário e do assistente.
- As entidades retornadas pelo backend não são exibidas.

### Limitações atuais do frontend

- Não existe gerenciamento de sessão real.
- Não existe login.
- Não existe histórico persistido.
- Não existe tela clínica estruturada.
- Não existe configuração por ambiente para a URL da API.
- Não existe tipagem forte da resposta da API.

## Estado atual do projeto

Este repositório representa um protótipo funcional, não uma aplicação pronta para produção.
Ao editar, preserve essa leitura arquitetural. Não apresentar no código nem na documentação
afirmações implícitas de robustez que o sistema ainda não possui.

## Como executar

### Backend

No diretório `backend/`:

```sh
npm start
```

Pré-requisito:

- criar `.env` com `HF_TOKEN=...`

### Frontend

No diretório `frontend/`:

```sh
npm run dev
```

## Regras de edição

- Mantenha mudanças do backend simples e localizadas, pois hoje a API está toda concentrada em
  `backend/src/server.js`.
- Se a alteração for maior, prefira introduzir modularização incremental em vez de reescrever
  tudo de uma vez.
- Não invente persistência, autenticação ou validação clínica inexistentes.
- Se adicionar novas integrações, documente claramente os novos `env vars`.
- Se alterar o contrato da API, atualizar também o cliente em `frontend/src/service/llmService.ts`.
- Se alterar o fluxo do chat, validar o comportamento ponta a ponta entre frontend e backend.

## Convenções recomendadas

- Backend:
  - validar entradas explicitamente;
  - manter respostas JSON consistentes;
  - evitar lógica clínica implícita não documentada;
  - não expor segredos no cliente.

- Frontend:
  - preferir tipagem explícita para respostas da API;
  - evitar `any` quando tocar nos arquivos atuais;
  - preservar a simplicidade da UI enquanto o fluxo principal não mudar;
  - manter compatibilidade com desktop e mobile.

## O que não fazer

- Não tratar o sistema atual como produto clínico validado.
- Não adicionar diagnóstico automático como se fosse objetivo atual do projeto.
- Não mover o token do Hugging Face para o frontend.
- Não acoplar novas features grandes sem mapear impacto no contrato do backend.
- Não quebrar o endpoint `/api/message` sem atualizar consumidor e documentação local.

## Checklist antes de encerrar mudanças

- O backend ainda sobe com `npm start`.
- O frontend ainda sobe com `npm run dev`.
- O fluxo de envio de mensagem continua funcional.
- O contrato `{ reply, entities }` continua coerente, salvo se a mudança tiver alterado isso de propósito.
- Nenhum segredo foi adicionado a arquivos versionáveis inadequados.
- A mudança é compatível com o estágio atual de protótipo funcional.

## Próximas evoluções naturais do projeto

Se a tarefa envolver evolução arquitetural, estes são caminhos coerentes com o estado atual:

- tipar a integração frontend-backend;
- mover `BASE_URL` para variável de ambiente;
- modularizar o backend em rotas e serviços;
- persistir histórico em banco;
- exibir entidades extraídas no frontend;
- criar autenticação e histórico clínico;
- adicionar testes automatizados.
