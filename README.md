# FinWise — Personal Finance Tracker

FinWise is a full-stack personal-finance dashboard for tracking income and expenses, setting budgets and savings goals, managing subscriptions, and reviewing spending patterns.

## Features

- Account registration, login, logout, and password-reset flows
- Transaction create/read/update/delete, filtering, pagination, and CSV export
- Expense categories and income/expense breakdowns
- Budgets, category budgets, and savings goals
- Subscription tracking and upcoming billing dates
- Dashboard summaries, monthly charts, category analytics, and reports
- Notifications, profile/settings pages, and theme preference
- An in-app finance assistant endpoint

## Technology

- Next.js App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui-style components, Framer Motion
- Prisma ORM with the libSQL adapter
- SQLite for local development or Turso/libSQL for a remote database
- TanStack Query for server-state fetching and Recharts for visualizations
- Docker and Render deployment configuration

## Getting started

Prerequisites: Bun (the repository's lockfile and Docker build use Bun) and a recent Node.js version supported by the installed Next.js version.

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a local `.env` file in the repository root. For local SQLite development:

   ```dotenv
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="replace-with-a-long-random-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   For remote Turso, also set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. When `TURSO_DATABASE_URL` is set, the database adapter uses it instead of `DATABASE_URL`.

3. Generate Prisma Client and initialize your development schema:

   ```bash
   bunx prisma generate
   bunx prisma db push
   ```

   **Important:** run schema commands against a development database first. If Turso variables are present, confirm the target database before pushing anything; do not accidentally apply a development schema to production.

4. Start the app:

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Application areas

| Area | Capabilities |
| --- | --- |
| Dashboard | Income, expenses, balances, recent activity, and charts |
| Transactions | Add/edit/delete, filter, and export records |
| Budgets | Set spending limits and review category usage |
| Goals | Track progress toward savings targets |
| Subscriptions | Manage recurring services and billing dates |
| Analytics and reports | Monthly trends, category distributions, and summaries |
| Notifications | View and mark alerts as read |
| AI assistant | Finance-oriented conversational guidance |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Local SQLite fallback, for example `file:./dev.db` |
| `TURSO_DATABASE_URL` | Optional remote Turso/libSQL database URL |
| `TURSO_AUTH_TOKEN` | Token for remote Turso access |
| `JWT_SECRET` | Signs authentication tokens; set a strong unique value |
| `NEXT_PUBLIC_APP_URL` | Public application URL in the deployment configuration |

## Important notes

- The `/api/ai/chat` route currently returns rule-based/demo responses from code; it does not call an external LLM provider or produce live, personalized financial analysis.
- The source includes a fallback JWT secret for development. Override it in every deployed environment.
- The package's `db:push` script includes `--accept-data-loss`. Prefer the explicit command above only after confirming the intended database and backing it up.

## Scripts

- `bun run dev` — development server
- `bun run build` — production build
- `bun run start` — start the standalone build with Bun
- `bun run lint` — ESLint
- `bun run db:generate` — generate Prisma Client
- `bun run db:push` — schema push (includes `--accept-data-loss`; use caution)
