import type { Faq, Product } from "@prisma/client";

// JSON-friendly shapes passed from server to client components.

export type ProductDTO = {
  id: string;
  name: string;
  type: string;
  nominalRatePct: number;
  setupFeeEur: number;
  monthlyFeeEur: number;
  minAmountEur: number;
  maxAmountEur: number;
  minTermMonths: number;
  maxTermMonths: number;
  notes: string;
};

export type FaqDTO = Pick<Faq, "id" | "topic" | "question" | "keywords" | "answer">;

export type ChatSessionDTO = { id: string; title: string; updatedAt: string; messageCount: number };

export type MessageDTO = { id: string; role: "user" | "assistant"; content: string; createdAt: string };

export function productToDTO(p: Product): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    nominalRatePct: Number(p.nominalRatePct),
    setupFeeEur: Number(p.setupFeeEur),
    monthlyFeeEur: Number(p.monthlyFeeEur),
    minAmountEur: p.minAmountEur,
    maxAmountEur: p.maxAmountEur,
    minTermMonths: p.minTermMonths,
    maxTermMonths: p.maxTermMonths,
    notes: p.notes,
  };
}

export function faqToDTO(f: Faq): FaqDTO {
  return { id: f.id, topic: f.topic, question: f.question, keywords: f.keywords, answer: f.answer };
}

export function messageToDTO(m: { id: string; role: "user" | "assistant"; content: string; createdAt: Date }): MessageDTO {
  return { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() };
}
