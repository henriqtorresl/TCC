export class UsersService {
  constructor(usersRepository = null) {
    this.usersRepository = usersRepository;
  }

  async getById(id) {
    if (!this.usersRepository) {
      throw new Error("database_not_configured");
    }
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error("invalid_user_id");
    }

    const user = await this.usersRepository.findById(numericId);
    if (!user) {
      throw new Error("user_not_found");
    }

    return user;
  }
}
