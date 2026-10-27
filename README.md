# cc-cost

Credit Compass: Consumer Credit Cost & Affordability Education Assistant, a cloud web app.

- **Calculator** (`/`): monthly payment, total repayment, total cost of credit and estimated DSTI for a chosen product. Every calculation is saved to PostgreSQL.
- **Products** (`/products`): synthetic example credit products.
- **FAQ** (`/faq`): searchable credit FAQ.

Stack: Next.js, TypeScript, Prisma, PostgreSQL. Hosted on [Render](https://render.com).

## Deploy on Render

1. In Render, create the services from `render.yaml` (**New → Blueprint**, pick this repo), or create them by hand:
   - **PostgreSQL** database.
   - **Web Service** from this GitHub repo, branch `main`, auto-deploy on.
     - Build command: `npm install && npx prisma generate && npm run build`
     - Start command: `npx prisma migrate deploy && npm start`
     - Environment variable `DATABASE_URL` = the database's **Internal Database URL**.
2. Render deploys automatically on every push to `main`. The start command applies Prisma migrations to the Render database before the app starts. The app listens on Render's `PORT`.
3. Load the products and FAQ data once (and again whenever the CSVs change):
   ```bash
   cp .env.example .env   # set DATABASE_URL to the database's External Database URL
   npm run db:seed
   ```

## Local development

There is no local PostgreSQL. Point `DATABASE_URL` in `.env` at the Render database's External Database URL, then:

```bash
npm install
npm run dev
```

Run `npm run build` before every push to `main`; a push deploys straight to production.

## Data

- `credit_products_railway.csv`: synthetic credit products.
- `credit_faq_railway.csv`: FAQ entries.
- `prisma/seed.ts` loads both (upsert, safe to rerun).

All figures are educational indicators, not lending decisions.
