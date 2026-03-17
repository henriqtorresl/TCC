import { Pool } from "pg";
import { env } from "@/lib/server/env";

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  if (!env.databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }

  return pool;
}
