export class ReportsController {
  constructor(reportsService) {
    this.reportsService = reportsService;
  }

  generate = async (req, res, next) => {
    try {
      const payload = await this.reportsService.generate(req.body);
      return res.status(201).json(payload);
    } catch (error) {
      if (error.message === "database_not_configured") {
        return res.status(503).json({ error: error.message });
      }
      if (
        error.message === "invalid_ids" ||
        error.message === "conversation_without_messages"
      ) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const report = await this.reportsService.getById(req.params.id);
      return res.json(report);
    } catch (error) {
      if (error.message === "database_not_configured") {
        return res.status(503).json({ error: error.message });
      }
      if (error.message === "invalid_report_id") {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === "report_not_found") {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  };
}
