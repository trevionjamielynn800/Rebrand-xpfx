import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { buildPostgresConfig } from "./connection-config";

const { Pool } = pg;

const postgresConfig = buildPostgresConfig(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: postgresConfig.connectionString,
  ssl: postgresConfig.ssl,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
