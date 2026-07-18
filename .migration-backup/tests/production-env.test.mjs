import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProductionEnvironment } from '../scripts/validate-production-env.mjs';

test('production validation requires secrets and database URL', () => {
  const env = {
    NODE_ENV: 'production',
    PORT: '3000',
    SESSION_SECRET: '',
    WALLET_ENCRYPTION_KEY: '',
    DATABASE_URL: '',
  };

  assert.throws(
    () => validateProductionEnvironment(env),
    /SESSION_SECRET/i,
  );
});

test('production validation accepts a complete configuration', () => {
  const env = {
    NODE_ENV: 'production',
    PORT: '3000',
    SESSION_SECRET: 'a-very-long-production-secret-value-1234567890',
    JWT_SECRET: 'another-very-long-production-secret-value-1234567890',
    WALLET_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/app?sslmode=require',
    ALLOWED_ORIGINS: 'https://app.example.com',
  };

  assert.doesNotThrow(() => validateProductionEnvironment(env));
});
