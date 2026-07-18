import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { validateProductionEnvironment } from '../../../scripts/validate-production-env.mjs';

type PrismaClientType = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT || DEFAULT_PORT);
const server = http.createServer(app);

let prisma: PrismaClientType | null = null;

function normalizePort(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL not set — continuing without Prisma persistence');
    return null;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const client = new PrismaClient();
    await client.$connect();
    console.log('[DB] PostgreSQL connected via Prisma');
    return client;
  } catch (error) {
    console.warn('[DB] Prisma unavailable — continuing without persistence', error);
    return null;
  }
}

async function bootstrap() {
  try {
    validateProductionEnvironment(process.env);
    prisma = await initDatabase();

    const resolvedPort = normalizePort(process.env.PORT || PORT);

    server.listen(resolvedPort, '0.0.0.0', () => {
      console.log(`[SERVER] XpressPro FX API running on port ${resolvedPort}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[SERVER] Health: http://0.0.0.0:${resolvedPort}/healthz`);
    });
  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    await prisma?.$disconnect();
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM received — shutting down gracefully');
  server.close(async () => {
    await prisma?.$disconnect();
    console.log('[SERVER] Shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[SERVER] SIGINT received — shutting down gracefully');
  server.close(async () => {
    await prisma?.$disconnect();
    process.exit(0);
  });
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${PORT} is already in use. Please stop the existing process or change PORT.`);
    console.error('[SERVER] If this is a local or VPS restart, wait a few seconds and try again.');
  } else {
    console.error('[SERVER] Failed to bind:', error);
  }
  process.exit(1);
});

bootstrap();
