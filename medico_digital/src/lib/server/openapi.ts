import { env } from "@/lib/server/env";

export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Medico Digital Backend API",
      version: "1.0.0",
      description:
        "API para anamnese assistida com modulos de auth, chat, usuarios e relatorios.",
    },
    servers: [{ url: env.appUrl, description: "Application URL" }],
    tags: [
      { name: "Health" },
      { name: "Chat" },
      { name: "Auth" },
      { name: "Users" },
      { name: "Reports" },
    ],
    paths: {
      "/api/health": { get: { tags: ["Health"], summary: "Health check" } },
      "/api/message": { post: { tags: ["Chat"], summary: "Send chat message" } },
      "/api/auth/register": {
        post: { tags: ["Auth"], summary: "Register a new user" },
      },
      "/api/auth/login": {
        post: { tags: ["Auth"], summary: "Authenticate user" },
      },
      "/api/users/{id}": { get: { tags: ["Users"], summary: "Get user by id" } },
      "/api/reports/generate": {
        post: { tags: ["Reports"], summary: "Generate report from conversation" },
      },
      "/api/reports/{id}": {
        get: { tags: ["Reports"], summary: "Get report by id" },
      },
    },
  };
}
