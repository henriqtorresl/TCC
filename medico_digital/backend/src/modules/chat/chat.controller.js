export class ChatController {
  constructor(chatService) {
    this.chatService = chatService;
  }

  sendMessage = async (req, res, next) => {
    try {
      const { userId, text } = req.body;
      const payload = await this.chatService.sendMessage({ userId, text });
      return res.json(payload);
    } catch (error) {
      if (error.message === "userId e text são obrigatórios") {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  };
}
