# Credit Compass

Understand the real cost of credit before you apply. An educational consumer-finance assistant. **It never makes, predicts or imitates a lending decision.**

- **Calculator:** annuity monthly payment, total interest, total fees, total repayment and estimated DSTI, with a warning above 40%.
- **Compare products:** 2–3 synthetic products side by side for the same amount and term.
- **FAQ:** searchable accordion of plain-language answers.
- **Assistant:** deterministic chat that answers only from the FAQ and product data. Chats are stored in PostgreSQL, so they survive reloads and are visible on other devices.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Lucide icons, Prisma, PostgreSQL on [Render](https://render.com).

## Deploy on Render

1. In Render choose **New → Blueprint** and pick this GitHub repo. `render.yaml` creates:
   - a **PostgreSQL** database `cc-cost-db`
   - a **Web Service** `cc-cost` that deploys automatically from `main`, with `DATABASE_URL` wired to the database
2. Or create them by hand:
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`
   - Environment variable `DATABASE_URL` = the database's **Internal Database URL**
3. On every start:
   - `prisma migrate deploy` applies new migrations from `prisma/migrations/`.
   - `npm start` then loads the CSV data and starts Next.js on Render's `PORT`.
   - Seeding is idempotent and never touches chats, so data survives reloads and redeploys.

Health check: `GET /api/health` reports whether the database is reachable.

## DATABASE_URL

`DATABASE_URL` is read only from the environment and is never hard-coded. Copy `.env.example` to `.env` (git-ignored) for local work and paste the Render database's **External Database URL**. There is no local PostgreSQL.

## Migrations and seed data

```bash
npm run db:migrate   # prisma migrate deploy
npm run db:seed      # load credit_products.csv + credit_faq.csv + chat settings
```

To change the schema, edit `prisma/schema.prisma` and create a new migration, for example by running `npx prisma migrate dev --name <change>` against a temporary Render database. Commit the migration; Render applies it on the next deploy.

## Local development

```bash
npm install
npm run dev
```

Run `npm run build` before every push to `main`, because a push deploys straight to production.

## Privacy

Do not enter names, personal identification codes, bank-account or card data. The assistant strips IBAN, card numbers, Estonian ID codes and e-mail addresses from messages before storing them. All products and data are synthetic; this app is for education and demonstration only.
