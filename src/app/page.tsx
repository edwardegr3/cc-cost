import { prisma } from "@/lib/prisma";
import { tryDb } from "@/lib/db";
import { faqToDTO, productToDTO } from "@/lib/types";
import Calculator from "@/components/Calculator";
import ProductComparison from "@/components/ProductComparison";
import FaqSection from "@/components/FaqSection";
import ChatAssistant from "@/components/ChatAssistant";
import { DbErrorNotice, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await tryDb(() =>
    Promise.all([
      prisma.product.findMany({ orderBy: { id: "asc" } }),
      prisma.faq.findMany({ orderBy: [{ topic: "asc" }, { id: "asc" }] }),
      prisma.chatSettings.findUnique({ where: { id: "default" } }),
    ]),
  );
  const products = data?.[0].map(productToDTO) ?? [];
  const faqs = data?.[1].map(faqToDTO) ?? [];
  const settings = data?.[2];

  return (
    <>
      <Section id="calculator" title="Loan cost calculator" subtitle="Estimate your monthly payment, total cost and DSTI.">
        <Calculator />
      </Section>

      <Section
        id="compare"
        title="Compare products"
        subtitle="Use the same amount and term to compare 2–3 synthetic example products."
      >
        {data === null ? <DbErrorNotice what="products" /> : <ProductComparison products={products} />}
      </Section>

      <Section id="faq" title="Learn the basics" subtitle="Plain-language answers to common consumer-credit questions.">
        {data === null ? <DbErrorNotice what="FAQ topics" /> : <FaqSection faqs={faqs} />}
      </Section>

      <Section
        id="assistant"
        title="Credit Compass assistant"
        subtitle="Ask about credit costs, fees, DSTI or the example products. Answers come only from this demo's FAQ and product data."
      >
        <ChatAssistant
          assistantName={settings?.assistantName ?? "Credit Compass Assistant"}
          welcomeMessage={
            settings?.welcomeMessage ??
            "Hi! I can explain credit costs, fees, DSTI and the synthetic example products in this demo."
          }
          maxLength={settings?.maxMessageLength ?? 1000}
        />
      </Section>
    </>
  );
}
