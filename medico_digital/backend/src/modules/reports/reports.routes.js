import { Router } from "express";

export function createReportsRoutes(reportsController) {
  const router = Router();
  router.post("/generate", reportsController.generate);
  router.get("/:id", reportsController.getById);
  return router;
}
