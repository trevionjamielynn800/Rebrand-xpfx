import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('[DB] PostgreSQL connected via Prisma');

    server.listen(PORT, () => {
      console.log(`[SERVER] XpressPro FX API running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
      console.log(`[SERVER] Health: http://localhost:${PORT}/healthz`);
    });
  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM received — shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[SERVER] Shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[SERVER] SIGINT received — shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

bootstrap();
