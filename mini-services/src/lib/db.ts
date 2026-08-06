import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production (Render) we talk to Turso over libSQL.
// Locally, if TURSO_DATABASE_URL isn't set, this falls back to the
// plain file DATABASE_URL (e.g. file:./dev.db) with no auth token,
// so `bun dev` still works against a local SQLite file untouched.
const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db