export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const payload = await this.authService.register(req.body);
      return res.status(201).json(payload);
    } catch (error) {
      if (
        error.message === "fullName, email and password are required" ||
        error.message === "email_already_in_use"
      ) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === "database_not_configured") {
        return res.status(503).json({ error: error.message });
      }
      return next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const payload = await this.authService.login(req.body);
      return res.json(payload);
    } catch (error) {
      if (
        error.message === "email and password are required" ||
        error.message === "invalid_credentials"
      ) {
        return res.status(401).json({ error: error.message });
      }
      if (error.message === "database_not_configured") {
        return res.status(503).json({ error: error.message });
      }
      return next(error);
    }
  };
}
