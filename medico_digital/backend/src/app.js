import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { InferenceClient } from "@huggingface/inference";
import { apiReference } from "@scalar/express-api-reference";
import { env } from "./config/env.js";
import { buildOpenApiSpec } from "./docs/openapi.js";
import { getDbPool } from "./shared/db/db.js";
import { createChatRoutes } from "./modules/chat/chat.routes.js";
import { ChatController } from "./modules/chat/chat.controller.js";
import { ChatService } from "./modules/chat/chat.service.js";
import { ChatRepository } from "./modules/chat/chat.repository.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createUsersRoutes } from "./modules/users/users.routes.js";
import { UsersController } from "./modules/users/users.controller.js";
import { UsersService } from "./modules/users/users.service.js";
import { UsersRepository } from "./modules/users/users.repository.js";
import { createReportsRoutes } from "./modules/reports/reports.routes.js";
import { ReportsController } from "./modules/reports/reports.controller.js";
import { ReportsService } from "./modules/reports/reports.service.js";
import { ReportsRepository } from "./modules/reports/reports.repository.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  const openApiSpec = buildOpenApiSpec(env.port);

  const db = getDbPool();
  if (!db) {
    console.warn(
      "DATABASE_URL is not configured. Database-backed features are disabled."
    );
  }

  const hf = new InferenceClient(env.hfToken || undefined);

  const chatRepository = db ? new ChatRepository(db) : null;
  const chatService = new ChatService(hf, chatRepository);
  const chatController = new ChatController(chatService);

  const authRepository = db ? new AuthRepository(db) : null;
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);

  const usersRepository = db ? new UsersRepository(db) : null;
  const usersService = new UsersService(usersRepository);
  const usersController = new UsersController(usersService);

  const reportsRepository = db ? new ReportsRepository(db) : null;
  const reportsService = new ReportsService(reportsRepository);
  const reportsController = new ReportsController(reportsService);

  app.get("/api/health", (_req, res) => {
    return res.json({
      status: "ok",
      database: db ? "configured" : "not_configured",
    });
  });

  app.get("/api/openapi.json", (_req, res) => {
    return res.json(openApiSpec);
  });

  app.use(
    "/api/docs",
    apiReference({
      spec: {
        url: "/api/openapi.json",
      },
      pageTitle: "Medico Digital API Docs",
      darkMode: true,
    })
  );

  app.use("/api", createChatRoutes(chatController));
  app.use("/api/auth", createAuthRoutes(authController));
  app.use("/api/users", createUsersRoutes(usersController));
  app.use("/api/reports", createReportsRoutes(reportsController));

  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    return res.status(500).json({ error: "internal_server_error" });
  });

  return app;
}
