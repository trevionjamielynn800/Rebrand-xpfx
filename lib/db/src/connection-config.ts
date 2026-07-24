import { URL } from 'node:url';

export type PostgresConnectionConfig = {
  connectionString: string;
  ssl: { rejectUnauthorized: boolean } | undefined;
};

export function buildPostgresConfig(
  rawUrl: string | undefined,
  env: Record<string, string | undefined> = process.env,
): PostgresConnectionConfig {
  if (!rawUrl) {
    throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
  }

  const url = new URL(rawUrl);
  const params = url.searchParams;

  const hasSslMode = params.has('sslmode');
  if (!hasSslMode) {
    params.set('sslmode', 'require');
  }

  const ssl = {
    rejectUnauthorized: false,
  };

  return {
    connectionString: url.toString(),
    ssl,
  };
}
