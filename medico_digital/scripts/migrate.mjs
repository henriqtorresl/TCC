import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not configured. Set DATABASE_URL before running migrations."
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(pool) {
  const result = await pool.query("SELECT filename FROM schema_migrations;");
  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(pool, filename, sql) {
  await pool.query("BEGIN");
  try {
    await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1);", [
      filename,
    ]);
    await pool.query("COMMIT");
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function run() {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const migrationsDir = path.resolve(__dirname, "../migrations");
    const files = (await fs.readdir(migrationsDir))
      .filter((filename) => filename.endsWith(".sql"))
      .sort();

    await ensureMigrationsTable(pool);
    const applied = await getAppliedMigrations(pool);

    for (const filename of files) {
      if (applied.has(filename)) {
        continue;
      }
      const migrationPath = path.join(migrationsDir, filename);
      const sql = await fs.readFile(migrationPath, "utf8");
      await applyMigration(pool, filename, sql);
    }

    console.log("Migrations completed.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
