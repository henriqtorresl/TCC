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
      { name: "Patients" },
      { name: "Reports" },
      { name: "Docs" },
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
      "/api/docs": {
        get: {
          tags: ["Docs"],
          summary: "Open API reference UI",
          responses: {
            200: {
              description: "Interactive API reference",
              content: {
                "text/html": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },
      "/api/openapi.json": {
        get: {
          tags: ["Docs"],
          summary: "Get OpenAPI specification",
          responses: {
            200: {
              description: "OpenAPI specification document",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: true,
                  },
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
                schema: { $ref: "#/components/schemas/ChatMessageRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Chat response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ChatMessageResponse" },
                },
              },
            },
            400: {
              description: "Invalid payload",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorObjectResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "User or patient not found",
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
      "/api/message/attendance/start": {
        post: {
          tags: ["Chat"],
          summary: "Start a new attendance",
          responses: {
            201: {
              description: "New attendance started",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StartAttendanceResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            400: {
              description: "Invalid user id or patient id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "User or patient not found",
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
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Clear the current session",
          responses: {
            200: {
              description: "Session cleared",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LogoutResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
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
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "User",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            400: {
              description: "Invalid user id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "User not found",
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
      "/api/patients/me": {
        get: {
          tags: ["Patients"],
          summary: "Get authenticated patient profile",
          responses: {
            200: {
              description: "Patient profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PatientResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "User not found",
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
        put: {
          tags: ["Patients"],
          summary: "Update authenticated patient profile",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdatePatientRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated patient profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PatientResponse" },
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
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "User or patient not found",
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
              description: "Report generated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Report" },
                },
              },
            },
            400: {
              description: "Invalid payload or conversation not ready",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorStringResponse" },
                      { $ref: "#/components/schemas/ConversationNotReadyResponse" },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
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
      "/api/reports/{id}": {
        get: {
          tags: ["Reports"],
          summary: "Get report by id",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Report",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Report" },
                },
              },
            },
            400: {
              description: "Invalid report id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Report not found",
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
      "/api/reports/{id}/download": {
        get: {
          tags: ["Reports"],
          summary: "Download report as PDF",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "PDF file",
              content: {
                "application/pdf": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            400: {
              description: "Invalid report id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Report or conversation not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            500: {
              description: "Template render or PDF generation error",
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
      "/api/reports/readiness": {
        get: {
          tags: ["Reports"],
          summary: "Get report readiness preview for a conversation",
          parameters: [
            {
              in: "query",
              name: "conversationId",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Conversation readiness preview",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ReportReadinessResponse" },
                },
              },
            },
            400: {
              description: "Invalid ids or conversation without messages",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Conversation not found for authenticated user",
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
      "/api/reports/availability": {
        get: {
          tags: ["Reports"],
          summary: "Check if a conversation has an up-to-date downloadable report",
          parameters: [
            {
              in: "query",
              name: "conversationId",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Report availability",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ReportAvailabilityResponse" },
                },
              },
            },
            400: {
              description: "Invalid ids",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Conversation not found",
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
      "/api/attendances": {
        get: {
          tags: ["Chat"],
          summary: "List attendances for authenticated user",
          responses: {
            200: {
              description: "Attendances list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AttendancesListResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            400: {
              description: "Invalid user id or patient id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "User or patient not found",
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
      "/api/attendances/{id}": {
        get: {
          tags: ["Chat"],
          summary: "Get attendance details for authenticated user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Attendance details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AttendanceDetailsResponse" },
                },
              },
            },
            400: {
              description: "Invalid attendance id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Attendance not found for authenticated user",
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
      "/api/attendances/{id}/messages": {
        get: {
          tags: ["Chat"],
          summary: "Get attendance messages for authenticated user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Attendance messages",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AttendanceMessagesResponse" },
                },
              },
            },
            400: {
              description: "Invalid attendance id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Attendance not found for authenticated user",
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
      "/api/attendances/{id}/finalize": {
        post: {
          tags: ["Chat"],
          summary: "Finalize an active attendance for authenticated user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Attendance finalized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FinalizeAttendanceResponse" },
                },
              },
            },
            400: {
              description: "Invalid attendance id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Attendance not found for authenticated user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            409: {
              description: "Attendance already completed or conflict on close",
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
      "/api/attendances/{id}/resume": {
        post: {
          tags: ["Chat"],
          summary: "Resume a completed attendance for authenticated user",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: {
              description: "Attendance resumed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FinalizeAttendanceResponse" },
                },
              },
            },
            400: {
              description: "Invalid attendance id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            401: {
              description: "Invalid or missing session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            404: {
              description: "Attendance not found for authenticated user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorStringResponse" },
                },
              },
            },
            409: {
              description: "Attendance already active or conflict on reopen",
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
        ChatEntity: {
          type: "object",
          properties: {
            label: { type: "string" },
            text: { type: "string" },
            score: { type: "number" },
          },
          required: ["label", "text", "score"],
        },
        ChatMessageRequest: {
          type: "object",
          properties: {
            text: { type: "string" },
          },
          required: ["text"],
        },
        ChatMessageResponse: {
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
        StartAttendanceResponse: {
          type: "object",
          properties: {
            conversationId: { type: "integer" },
          },
          required: ["conversationId"],
        },
        LogoutResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
          },
          required: ["success"],
        },
        AttendanceSummary: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: ["string", "null"] },
            status: { type: "string" },
            started_at: { type: "string", format: "date-time" },
            ended_at: { type: ["string", "null"], format: "date-time" },
            last_message_at: { type: ["string", "null"], format: "date-time" },
            message_count: { type: "string" },
          },
          required: [
            "id",
            "title",
            "status",
            "started_at",
            "ended_at",
            "last_message_at",
            "message_count",
          ],
        },
        AttendanceDetailsResponse: {
          type: "object",
          properties: {
            attendance: { $ref: "#/components/schemas/AttendanceSummary" },
          },
          required: ["attendance"],
        },
        AttendancesListResponse: {
          type: "object",
          properties: {
            attendances: {
              type: "array",
              items: { $ref: "#/components/schemas/AttendanceSummary" },
            },
          },
          required: ["attendances"],
        },
        AttendanceMessage: {
          type: "object",
          properties: {
            id: { type: "integer" },
            role: { type: "string" },
            content: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
          required: ["id", "role", "content", "created_at"],
        },
        AttendanceMessagesResponse: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: { $ref: "#/components/schemas/AttendanceMessage" },
            },
          },
          required: ["messages"],
        },
        GenerateReportRequest: {
          type: "object",
          properties: {
            conversationId: { type: "integer" },
            allowIncomplete: { type: "boolean", default: false },
          },
          required: ["conversationId"],
        },
        Report: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            conversation_id: { type: "integer" },
            summary: { type: "string" },
            status: { type: "string", example: "draft" },
            metadata: {
              type: "object",
              additionalProperties: true,
            },
            generated_at: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "user_id",
            "conversation_id",
            "summary",
            "status",
            "metadata",
            "generated_at",
          ],
        },
        ConversationNotReadyResponse: {
          type: "object",
          properties: {
            error: { type: "string", enum: ["conversation_not_ready"] },
            details: {
              type: "object",
              properties: {
                missingCriteria: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["missingCriteria"],
            },
          },
          required: ["error", "details"],
        },
        ReportReadinessResponse: {
          type: "object",
          properties: {
            conversationId: { type: "integer" },
            conversationStatus: { type: "string" },
            messageCount: { type: "integer" },
            readiness: {
              type: "object",
              properties: {
                is_ready: { type: "boolean" },
                score: { type: "integer" },
                required_score: { type: "integer" },
                criteria: {
                  type: "object",
                  additionalProperties: { type: "boolean" },
                },
                missing_criteria: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: [
                "is_ready",
                "score",
                "required_score",
                "criteria",
                "missing_criteria",
              ],
            },
            sections: {
              type: "object",
              additionalProperties: { type: ["string", "null"] },
            },
          },
          required: [
            "conversationId",
            "conversationStatus",
            "messageCount",
            "readiness",
            "sections",
          ],
        },
        FinalizeAttendanceResponse: {
          type: "object",
          properties: {
            attendanceId: { type: "integer" },
            status: { type: "string", example: "completed" },
            ended_at: { type: ["string", "null"], format: "date-time" },
          },
          required: ["attendanceId", "status", "ended_at"],
        },
        ReportAvailabilityResponse: {
          type: "object",
          properties: {
            conversationId: { type: "integer" },
            hasReport: { type: "boolean" },
            canDownload: { type: "boolean" },
            reportId: { type: ["integer", "null"] },
          },
          required: ["conversationId", "hasReport", "canDownload", "reportId"],
        },
        Patient: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            email: { type: "string", format: "email" },
            full_name: { type: "string" },
            birth_date: { type: ["string", "null"], format: "date" },
            cpf: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            gender: {
              type: ["string", "null"],
              enum: ["male", "female", "other", "unknown", null],
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "user_id",
            "email",
            "full_name",
            "birth_date",
            "cpf",
            "phone",
            "gender",
            "created_at",
            "updated_at",
          ],
        },
        PatientResponse: {
          type: "object",
          properties: {
            patient: { $ref: "#/components/schemas/Patient" },
          },
          required: ["patient"],
        },
        UpdatePatientRequest: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            birthDate: { type: ["string", "null"], format: "date" },
            cpf: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            gender: {
              type: ["string", "null"],
              enum: ["male", "female", "other", "unknown", null],
            },
          },
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
