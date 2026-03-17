export class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  getById = async (req, res, next) => {
    try {
      const user = await this.usersService.getById(req.params.id);
      return res.json(user);
    } catch (error) {
      if (error.message === "database_not_configured") {
        return res.status(503).json({ error: error.message });
      }
      if (error.message === "invalid_user_id") {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === "user_not_found") {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  };
}
