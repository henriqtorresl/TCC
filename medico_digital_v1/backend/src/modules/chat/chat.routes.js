import { Router } from "express";

export function createChatRoutes(chatController) {
  const router = Router();
  router.post("/message", chatController.sendMessage);
  return router;
}
