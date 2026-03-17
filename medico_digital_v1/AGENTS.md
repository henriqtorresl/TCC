# AGENTS.md

## Objetivo

Guia local para evoluir o projeto `medico_digital` com foco em backend e frontend sem perder
o comportamento funcional atual do chat.

## Escopo

Vale para todo o diretório `medico_digital/`.

## Estado atual da arquitetura

- `backend/`:
  - API Express modularizada por dominio (`auth`, `chat`, `reports`, `users`).
  - Camadas: `routes -> controller -> service -> repository`.
  - Banco PostgreSQL com migrations SQL versionadas.
  - Documentacao OpenAPI + Scalar.

- `frontend/`:
  - React + TypeScript + Vite.
  - Chat funcional chamando `POST /api/message`.
  - UI simples de conversa; sem fluxo completo de sessao/autenticacao.

## Backend

### Arquivos principais

- `backend/src/app.js`: composicao da aplicacao e registro de rotas.
- `backend/src/server.js`: bootstrap do servidor.
- `backend/src/config/env.js`: variaveis de ambiente.
- `backend/src/shared/db/db.js`: conexao com Postgres.
- `backend/src/shared/db/migrate.js`: runner de migrations.
- `backend/migrations/`: arquivos SQL versionados.
- `backend/src/docs/openapi.js`: especificacao OpenAPI.

### Rotas principais

- `GET /api/health`
- `GET /api/openapi.json`
- `GET /api/docs`
- `POST /api/message`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/:id`
- `POST /api/reports/generate`
- `GET /api/reports/:id`

### Modelos IA do chat

- Conversa: `meta-llama/Llama-3.1-8B-Instruct`
- NER: `d4data/biomedical-ner-all`

### Regra importante do chat

- Manter prompt em portugues conforme comportamento validado.
- Manter contrato principal do endpoint de chat:
  - request: `{ userId, text }`
  - response: `{ reply, entities }`

## Banco de dados local (somente desenvolvimento)

Comandos:

```sh
npm run db:dev:up
npm run db:dev:down
```

Observacoes:

- Esses comandos sao para ambiente de desenvolvimento local.
- `docker-compose` do backend sobe apenas PostgreSQL.
- Nao ha Adminer na stack atual.

## Migrations

Executar:

```sh
npm run migrate
```

Pre-requisito:

- `DATABASE_URL` configurada no `.env`.

## Documentacao da API

- OpenAPI JSON: `/api/openapi.json`
- Scalar UI: `/api/docs`

## Regras de edicao

- Nao quebrar o endpoint legado `/api/message`.
- Nao mover segredos para o frontend.
- Se alterar contrato de API, atualizar:
  - `backend/src/docs/openapi.js`
  - consumidor no frontend
  - README relevante.
- Se alterar schema, criar nova migration SQL em `backend/migrations/`.

## Checklist rapido antes de encerrar mudancas

- Backend sobe (`npm run dev` ou `npm start`).
- Banco local de dev sobe (`npm run db:dev:up`).
- Migrations aplicam (`npm run migrate`).
- Chat continua respondendo.
- `/api/docs` continua acessivel.
