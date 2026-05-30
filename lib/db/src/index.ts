import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import mongoose from "mongoose";

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

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/cafeteria";
mongoose.connect(mongoUri).catch(err => {
  console.error("MongoDB connection error:", err);
});

export * from "./schema/index";
export { User } from "./models/User";
export { Category } from "./models/Category";
export { Product } from "./models/Product";
export { CartItem } from "./models/CartItem";
export { Order } from "./models/Order";
export { Payment } from "./models/Payment";
export { Counter, getNextSequence } from "./models/Counter";
