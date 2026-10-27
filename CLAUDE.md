# CLAUDE.md

Credit Compass (repo `cc-cost`): educational consumer-credit assistant. It must never make, predict or imitate a real lending decision.

## Stack

- Next.js App Router + TypeScript, Tailwind CSS v4, Lucide icons
- Prisma ORM
- PostgreSQL hosted on **Render**. Render is the only platform; do not add Railway or other platform config.

## Deployment (Render)

- The app runs as a **Render Web Service** backed by a **Render PostgreSQL** database (`render.yaml` Blueprint).
- Deployment source: GitHub `main` branch (`https://github.com/edwardegr3/cc-cost`). Render auto-deploys on every push to `main`.
- Render service commands:
  - Build: `npm install && npx prisma generate && npm run build`
  - Start: `npx prisma migrate deploy && npm start`
- `npm start` runs the idempotent seed (non-fatal if the DB is down), then `next start` on `$PORT`.

## Database rules

- The connection string comes only from `DATABASE_URL`. Never hard-code credentials.
- Do not create or depend on a local PostgreSQL database. Locally, `DATABASE_URL` points at the Render database's External URL.
- Schema changes go through a new committed migration in `prisma/migrations/`. Never edit a migration that has already been deployed.

## Environment files

- `.env` is git-ignored; `.env.example` is committed with placeholders only.

## Before every push

- `npm run build` must succeed, because a push to `main` deploys to production.

## Invariants

- Keep all Credit Compass features and database persistence working when changing infrastructure.
- Results are always labelled as estimates; the DSTI warning (> 40%) is educational and never says whether someone would be approved.
- The chat assistant answers only from FAQ and product data; anything else gets the fallback "not enough information" message.
- Never request or store personal data; `redactPersonalData` strips identifiers before chat messages are saved.
- If the DB is unavailable, pages show a friendly error (`tryDb` / `withDb` in `src/lib/db.ts`) instead of crashing.

## Layout

- `src/app/page.tsx`: single page with sections: calculator, compare, FAQ, assistant.
- `src/components/`: `Calculator`, `ProductComparison`, `FaqSection`, `ChatAssistant`, shared `ui`.
- `src/lib/credit.ts`: loan maths and validation. `src/lib/assistant.ts`: deterministic reply logic and redaction.
- `src/app/api/`: `products`, `faq`, `health`, `chats`, `chats/[id]`, `chats/[id]/messages`.
- Prisma models: `Product`, `Faq` (table `FAQ`), `ChatSession`, `Message`, `ChatSettings` (single row `default`).
- Versions are pinned: Prisma 6 (keeps `url = env("DATABASE_URL")` in the schema), Next.js 15, TypeScript 5. Build-time tools are in `dependencies` so Render installs them even with `NODE_ENV=production`.

## Seed data

- `credit_products.csv` and `credit_faq.csv` are synthetic; `prisma/seed.ts` upserts them plus default `ChatSettings`.
