import { Pool } from "pg";
import { env } from "../../config/env.js";

let pool = null;

export function getDbPool() {
  if (!env.databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }

  return pool;
}
