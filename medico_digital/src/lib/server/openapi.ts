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
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Service status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/api/message": { post: { tags: ["Chat"], summary: "Send chat message" } },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "User created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RegisterResponse" },
                },
              },
            },
            400: {
              description: "Validation error or invalid JSON body",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorObjectResponse" },
                      { $ref: "#/components/schemas/ErrorStringResponse" },
                    ],
                  },
                },
              },
            },
            503: {
              description: "Database not configured",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Authenticate user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Authenticated session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            400: {
              description: "Validation error or invalid JSON body",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorObjectResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            503: {
              description: "Database not configured",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
          },
        },
      },
      "/api/users/{id}": { get: { tags: ["Users"], summary: "Get user by id" } },
      "/api/reports/generate": {
        post: { tags: ["Reports"], summary: "Generate report from conversation" },
      },
      "/api/reports/{id}": {
        get: { tags: ["Reports"], summary: "Get report by id" },
      },
    },
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            database: {
              type: "string",
              enum: ["configured", "not_configured"],
            },
          },
          required: ["status", "database"],
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            full_name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
          required: ["id", "full_name", "email", "role"],
        },
        RegisterRequest: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
          required: ["fullName", "email", "password"],
        },
        RegisterResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
          },
          required: ["user"],
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },
        LoginResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            session: {
              type: "object",
              properties: {
                id: { type: "integer" },
                user_id: { type: "integer" },
                expires_at: { type: "string", format: "date-time" },
                created_at: { type: "string", format: "date-time" },
              },
              required: ["id", "user_id", "expires_at", "created_at"],
            },
            refreshToken: { type: "string" },
          },
          required: ["user", "session", "refreshToken"],
        },
        ErrorStringResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
          required: ["error"],
        },
        ErrorObjectResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: {
                  type: "object",
                  additionalProperties: true,
                },
              },
              required: ["code", "message"],
            },
          },
          required: ["error"],
        },
      },
    },
  };
}
