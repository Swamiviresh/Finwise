import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Provide a fallback DATABASE_URL for environments where it's not set
// This prevents the PrismaClient constructor from throwing at import time
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (url) return url
  // Fallback to a temp SQLite file (works on Render free tier)
  const fallback = 'file:/tmp/finwise.db'
  console.warn(`[FinWise] DATABASE_URL not set, using fallback: ${fallback}`)
  process.env.DATABASE_URL = fallback
  return fallback
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db