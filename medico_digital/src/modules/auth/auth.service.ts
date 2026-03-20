import crypto from "node:crypto";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { LoginInput, RegisterInput } from "@/modules/auth/types";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (hashBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository | null = null) {}

  async register({ fullName, email, password }: RegisterInput) {
    if (!this.authRepository) {
      throw new Error("database_not_configured");
    }
    if (!fullName || !email || !password) {
      throw new Error("fullName, email and password are required");
    }

    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error("email_already_in_use");
    }

    const passwordHash = hashPassword(password);
    const user = await this.authRepository.createUser({
      fullName,
      email,
      passwordHash,
    });

    return { user };
  }

  async login({ email, password }: LoginInput) {
    if (!this.authRepository) {
      throw new Error("database_not_configured");
    }
    if (!email || !password) {
      throw new Error("email and password are required");
    }

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new Error("invalid_credentials");
    }

    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const session = await this.authRepository.createSession({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      session,
      refreshToken,
    };
  }
}
