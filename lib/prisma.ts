import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Handle Vercel serverless environment (where deployment directory is read-only)
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  if (!fs.existsSync(tmpDbPath)) {
    const seedDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const rootDbPath = path.join(process.cwd(), 'dev.db');

    if (fs.existsSync(seedDbPath)) {
      fs.copyFileSync(seedDbPath, tmpDbPath);
    } else if (fs.existsSync(rootDbPath)) {
      fs.copyFileSync(rootDbPath, tmpDbPath);
    }
  }
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
} else if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:./')) {
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
