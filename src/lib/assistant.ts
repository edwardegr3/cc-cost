// Deterministic educational assistant: answers only from FAQ and product data.
// No external AI service; unknown questions get the fallback message.
import type { FaqDTO, ProductDTO } from "@/lib/types";

const STOPWORDS = new Set(
  "a an the is are was were be been am i me my you your we our it its this that these those of to in on for with and or but if can could would should will do does did how what why when where which who whom about from by at as into than then there their them they he she his her not no so just also any some more most very much many get got have has had".split(
    " ",
  ),
);

const GREETINGS = new Set(["hi", "hello", "hey", "hiya", "morning", "evening", "good"]);
const THANKS = new Set(["thanks", "thank", "thx", "cheers", "ty"]);

const PRODUCT_LIST_INTENT = /\b(products|cheapest|lowest|highest|available|offers?|list)\b/;
const PRODUCT_MENTION = /\b(products?|loans?|options?)\b/;

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(word: string): string {
  for (const suffix of ["ing", "ed", "al", "es", "s", "e"]) {
    if (word.length > 4 && word.endsWith(suffix)) return word.slice(0, -suffix.length);
  }
  return word;
}

// Stopwords are dropped so "miss a payment" matches the keyword "missed payment".
function stems(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

function containsSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

export function scoreFaq(question: string, faq: FaqDTO): number {
  const text = stems(question);
  let score = 0;
  for (const keyword of faq.keywords) {
    const kw = stems(keyword);
    if (containsSequence(text, kw)) score += 3 * kw.length;
  }
  const textSet = new Set(text);
  for (const w of stems(faq.question)) {
    if (w.length > 3 && !STOPWORDS.has(w) && textSet.has(w)) score += 1;
  }
  if (containsSequence(text, stems(faq.topic))) score += 2;
  return score;
}

function describeProduct(p: ProductDTO): string {
  return (
    `${p.name} (${p.type}): nominal rate ${p.nominalRatePct}%, contract/setup fee ${eur.format(p.setupFeeEur)}, ` +
    `monthly fee ${eur.format(p.monthlyFeeEur)}, amount ${eur.format(p.minAmountEur)}–${eur.format(p.maxAmountEur)}, ` +
    `term ${p.minTermMonths}–${p.maxTermMonths} months. ${p.notes}`
  );
}

function productOverview(products: ProductDTO[]): string {
  const lowestRate = [...products].sort((a, b) => a.nominalRatePct - b.nominalRatePct)[0];
  const lines = products.map((p) => `• ${p.name}: ${p.nominalRatePct}%, setup ${eur.format(p.setupFeeEur)}, monthly fee ${eur.format(p.monthlyFeeEur)}`);
  return [
    "These are the synthetic example products in this demo:",
    ...lines,
    "",
    `The lowest nominal rate is ${lowestRate.name} (${lowestRate.nominalRatePct}%), but a lower rate does not always mean a lower total cost — fees matter too. Use “Compare products” with the same amount and term to see estimated totals.`,
  ].join("\n");
}

export function generateReply(
  question: string,
  faqs: FaqDTO[],
  products: ProductDTO[],
  fallbackMessage: string,
): string {
  const norm = normalize(question);
  const words = norm.split(" ").filter(Boolean);

  if (words.length > 0 && words.length <= 4 && words.every((w) => GREETINGS.has(w) || THANKS.has(w) || STOPWORDS.has(w))) {
    return words.some((w) => THANKS.has(w))
      ? "You're welcome! Ask me anything else about credit costs, fees, DSTI or the example products."
      : "Hello! Ask me about interest rates, fees, total repayment, DSTI, repayment questions or the synthetic example products.";
  }

  // Specific product mentioned by name or id.
  const named = products.filter((p) => norm.includes(normalize(p.name)) || norm.includes(normalize(p.id)));
  if (named.length > 0) {
    return `${named.map(describeProduct).join("\n\n")}\n\nAll products are synthetic examples; figures are for education only.\n\nSource: synthetic product data`;
  }

  const ranked = faqs
    .map((faq) => ({ faq, score: scoreFaq(question, faq) }))
    .filter((r) => r.score >= 3)
    .sort((a, b) => b.score - a.score);

  const productOverviewReply = `${productOverview(products)}\n\nSource: synthetic product data`;
  // Product list questions ("which products are available?") beat weak FAQ matches.
  if (products.length > 0 && PRODUCT_LIST_INTENT.test(norm) && (ranked.length === 0 || ranked[0].score < 6)) {
    return productOverviewReply;
  }

  if (ranked.length > 0) {
    const { faq } = ranked[0];
    return `${faq.answer}\n\nSource: FAQ · ${faq.topic}`;
  }

  if (products.length > 0 && PRODUCT_MENTION.test(norm)) return productOverviewReply;

  return fallbackMessage;
}

// Strips common personal identifiers before a message is stored.
const PERSONAL_PATTERNS: RegExp[] = [
  /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/gi, // IBAN
  /\b(?:\d[ -]?){13,19}\b/g, // payment card numbers
  /\b[1-8]\d{10}\b/g, // Estonian personal identification code
  /[\w.+-]+@[\w-]+\.[\w.-]+/g, // e-mail address
];

export function redactPersonalData(text: string): { text: string; redacted: boolean } {
  let redacted = false;
  let out = text;
  for (const pattern of PERSONAL_PATTERNS) {
    out = out.replace(pattern, () => {
      redacted = true;
      return "[removed]";
    });
  }
  return { text: out, redacted };
}

export const REDACTION_NOTICE =
  "Note: something that looked like personal data (for example an account number, ID code or e-mail) was removed from your message. Please don't share personal or confidential information here.";
