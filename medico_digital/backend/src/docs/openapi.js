export function buildOpenApiSpec(port) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Medico Digital Backend API",
      version: "1.0.0",
      description:
        "API para anamnese assistida com modulos de auth, chat, usuarios e relatorios.",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local development",
      },
    ],
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
      "/api/message": {
        post: {
          tags: ["Chat"],
          summary: "Send chat message",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Chat reply with extracted entities",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ChatResponse" },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
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
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
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
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user by id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "User found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/reports/generate": {
        post: {
          tags: ["Reports"],
          summary: "Generate report from conversation",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GenerateReportRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Report created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Report" },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/reports/{id}": {
        get: {
          tags: ["Reports"],
          summary: "Get report by id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Report found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Report" },
                },
              },
            },
            404: {
              description: "Report not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
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
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
          required: ["error"],
        },
        ChatRequest: {
          type: "object",
          properties: {
            userId: { type: "string", example: "1" },
            text: { type: "string", example: "Estou com dor de cabeca." },
          },
          required: ["userId", "text"],
        },
        ChatEntity: {
          type: "object",
          properties: {
            label: { type: "string" },
            text: { type: "string" },
            score: { type: "number" },
          },
          required: ["label", "text", "score"],
        },
        ChatResponse: {
          type: "object",
          properties: {
            reply: { type: "string" },
            entities: {
              type: "array",
              items: { $ref: "#/components/schemas/ChatEntity" },
            },
          },
          required: ["reply", "entities"],
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
        GenerateReportRequest: {
          type: "object",
          properties: {
            userId: { type: "integer" },
            conversationId: { type: "integer" },
          },
          required: ["userId", "conversationId"],
        },
        Report: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            conversation_id: { type: "integer" },
            summary: { type: "string" },
            status: { type: "string" },
            metadata: { type: "object", nullable: true },
            generated_at: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "user_id",
            "conversation_id",
            "summary",
            "status",
            "generated_at",
          ],
        },
      },
    },
  };
}
