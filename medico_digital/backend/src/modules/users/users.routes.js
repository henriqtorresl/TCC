import { Router } from "express";

export function createUsersRoutes(usersController) {
  const router = Router();
  router.get("/:id", usersController.getById);
  return router;
}
