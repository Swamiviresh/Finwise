FROM oven/bun:1-debian AS base

WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL just needs to be *set* for `prisma generate` to run;
# it doesn't need to be reachable at build time.
ENV DATABASE_URL="file:./dev.db"
RUN bunx prisma generate
# `bun run build` already copies .next/static and public/ into
# .next/standalone/ for us (see package.json build script)
RUN bun run build

# --- runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["bun", "server.js"]
