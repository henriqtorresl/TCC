# Backend - Medico Digital

Backend em Node.js + Express para anamnese assistida com arquitetura em camadas.

## Stack

- Node.js 20+
- Express
- Hugging Face Inference (`@huggingface/inference`)
- PostgreSQL (`pg`)

## Estrutura

```txt
src/
  app.js
  server.js
  config/
    env.js
  shared/
    db/
      db.js
      migrate.js
  modules/
    auth/
    chat/
    reports/
    users/
migrations/
  0001_initial_schema.sql
```

## Modulos

- `auth`: registro/login e sessao
- `chat`: endpoint de conversa (`/api/message`) e extracao de entidades
- `reports`: geracao e consulta de relatorios
- `users`: consulta de usuario por id

## Variaveis de ambiente

Use `.env` com:

```env
HF_TOKEN=seu_token_huggingface
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medico_digital
```

Se `DATABASE_URL` nao estiver configurada, rotas dependentes de banco retornam erro `503`,
mas a API ainda sobe.

## Execucao

Instalar dependencias:

```sh
npm install
```

Subir banco local (PostgreSQL), apenas para ambiente de desenvolvimento:

```sh
npm run db:dev:up
```

Parar banco local de desenvolvimento:

```sh
npm run db:dev:down
```

Executar migrations:

```sh
npm run migrate
```

Subir servidor (prod-like):

```sh
npm start
```

Subir servidor em desenvolvimento (auto-reload):

```sh
npm run dev
```

## Endpoints base

- `GET /api/health`
- `GET /api/openapi.json`
- `GET /api/docs`
- `POST /api/message`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/:id`
- `POST /api/reports/generate`
- `GET /api/reports/:id`
