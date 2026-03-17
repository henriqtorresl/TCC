import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { UsersRepository } from "@/modules/users/users.repository";
import { UsersService } from "@/modules/users/users.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = getDbPool();
const usersRepository = db ? new UsersRepository(db) : null;
const usersService = new UsersService(usersRepository);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await usersService.getById(id);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.message === "database_not_configured") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "invalid_user_id") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "user_not_found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Unhandled error in /api/users/[id]:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
