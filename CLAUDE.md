# CLAUDE.md

Credit Compass (repo `cc-cost`): Consumer Credit Cost & Affordability Education Assistant, a cloud web app.

## Stack

- Next.js + TypeScript
- Prisma ORM
- PostgreSQL hosted on **Render** (not Railway; all Railway configuration and docs are replaced by Render)

## Deployment (Render)

- The app runs as a **Render Web Service** backed by a **Render PostgreSQL** database.
- Deployment source: GitHub `main` branch (`https://github.com/edwardegr3/cc-cost`). Render auto-deploys on every push to `main`.
- Render service commands:
  - Build: `npm install && npx prisma generate && npm run build`
  - Start: `npx prisma migrate deploy && npm start`
- The app must listen on the `PORT` env var provided by Render (e.g. `"start": "next start -p ${PORT:-3000}"`).
- Prisma migrations run against the Render PostgreSQL database via `prisma migrate deploy` at start. Commit migration files under `prisma/migrations/`.

## Database rules

- The connection string comes only from the `DATABASE_URL` environment variable (`datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`).
- Never hard-code database credentials anywhere: code, config, docs or commits.
- Do not create or depend on a local PostgreSQL database. For local development, point `DATABASE_URL` at the Render database (external connection URL).

## Environment files

- `.env` is git-ignored and never committed.
- `.env.example` is committed and lists every required variable with placeholder values, e.g.:
  ```
  DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
  ```

## Before every push

- `npm run build` must succeed. Fix all type and build errors before pushing to `main`, because a push deploys straight to production.

## Invariants

- All existing Credit Compass functionality and database persistence must stay unchanged when changing infrastructure.

## Layout & commands

- `src/app/`: pages (`/` calculator, `/products`, `/faq`) and API routes (`/api/products`, `/api/faq`, `/api/calculations`). DB-backed pages use `dynamic = "force-dynamic"` so the build never needs a database.
- `src/lib/credit.ts`: cost & DSTI maths; `src/lib/prisma.ts`: Prisma client singleton.
- `prisma/schema.prisma`, `prisma/migrations/`: schema changes go through a new committed migration (applied on Render by `migrate deploy`).
- `npm run db:seed`: upserts both CSVs into the database in `DATABASE_URL` (run manually; not part of the deploy).
- `render.yaml`: Render Blueprint for the web service + database.
- Versions are pinned: Prisma 6 (keeps `url = env("DATABASE_URL")` in the schema), Next.js 15, TypeScript 5. Build-time tools are in `dependencies` so Render installs them even with `NODE_ENV=production`.

## Seed data

- `credit_products_railway.csv`: synthetic credit products (rates, fees, amount/term limits).
- `credit_faq_railway.csv`: FAQ entries (topic, question, keywords, answer).
- The `_railway` suffix in these filenames is historical; the data is platform-independent.
- All content is educational: affordability figures (e.g. DSTI) are indicators, not lending decisions.
