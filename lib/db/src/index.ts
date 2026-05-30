import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL ?? "file:./artifacts/db.sqlite";

// NOTE: Current implementation uses `pg` Pool + Postgres connectionString.
// If you set DATABASE_URL to a SQLite URL, the app may not work.
// This fallback is only to allow local boot when no env var is provided.
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL was not set. Falling back to:",
    databaseUrl,
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";
