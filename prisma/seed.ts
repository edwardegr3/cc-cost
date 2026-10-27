// Loads the product and FAQ CSVs and default chat settings into the database
// pointed to by DATABASE_URL. Idempotent: rows are upserted, chats are never
// touched, so it runs safely on every start (see `npm start`).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = join(__dirname, "..");

// Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, commas/newlines in quotes).
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...data] = rows.filter((r) => r.some((v) => v.trim() !== ""));
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

function readCsv(file: string) {
  return parseCsv(readFileSync(join(root, file), "utf8"));
}

async function main() {
  const products = readCsv("credit_products.csv");
  for (const p of products) {
    const data = {
      name: p.product_name,
      type: p.product_type,
      nominalRatePct: p.nominal_rate_pct,
      setupFeeEur: p.setup_fee_eur,
      monthlyFeeEur: p.monthly_fee_eur,
      minAmountEur: Number(p.min_amount_eur),
      maxAmountEur: Number(p.max_amount_eur),
      minTermMonths: Number(p.min_term_months),
      maxTermMonths: Number(p.max_term_months),
      notes: p.notes,
    };
    await prisma.product.upsert({ where: { id: p.product_id }, create: { id: p.product_id, ...data }, update: data });
  }

  const faqs = readCsv("credit_faq.csv");
  for (const f of faqs) {
    const data = {
      topic: f.topic,
      keywords: f.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      answer: f.answer,
    };
    await prisma.faq.upsert({ where: { question: f.question }, create: { question: f.question, ...data }, update: data });
  }

  // Created once; later edits in the database are kept.
  await prisma.chatSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      welcomeMessage:
        "Hi! I can explain credit costs, fees, DSTI and the synthetic example products in this demo. Please don't share personal or confidential information.",
      fallbackMessage:
        "Sorry, this demo does not have enough information to answer that. Try asking about interest rates, fees, total repayment, DSTI, early or late repayment, or the example products.",
    },
  });

  console.log(`Seeded ${products.length} products, ${faqs.length} FAQ entries and chat settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
