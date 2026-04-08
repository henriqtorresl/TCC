import crypto from "node:crypto";
import { cookies } from "next/headers";
import { AuthRepository } from "@/modules/auth/auth.repository";

export type SessionUserResult =
  | { success: true; userId: number }
  | { success: false; error: "database_not_configured" | "invalid_session" };

export async function getSessionUserId(
  authRepository: AuthRepository | null,
): Promise<SessionUserResult> {
  if (!authRepository) {
    return { success: false, error: "database_not_configured" };
  }

  const refreshToken = (await cookies()).get("md_refresh_token")?.value;
  if (!refreshToken) {
    return { success: false, error: "invalid_session" };
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await authRepository.findValidSessionByRefreshTokenHash(
    refreshTokenHash,
  );

  if (!session) {
    return { success: false, error: "invalid_session" };
  }

  return { success: true, userId: session.user_id };
}
