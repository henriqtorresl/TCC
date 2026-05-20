import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { AuthRepository } from "@/modules/auth/auth.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const authRepository = db ? new AuthRepository(db) : null;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("md_refresh_token")?.value;

    if (refreshToken && authRepository) {
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
      await authRepository.revokeSessionByRefreshTokenHash(refreshTokenHash);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "md_refresh_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Unhandled error in /api/auth/logout:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
