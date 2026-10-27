import { prisma } from "@/lib/prisma";

export async function searchFaq(query: string | undefined) {
  const q = query?.trim();
  if (!q) return prisma.faq.findMany({ orderBy: [{ topic: "asc" }, { id: "asc" }] });

  return prisma.faq.findMany({
    where: {
      OR: [
        { question: { contains: q, mode: "insensitive" } },
        { answer: { contains: q, mode: "insensitive" } },
        { topic: { contains: q, mode: "insensitive" } },
        { keywords: { has: q.toLowerCase() } },
      ],
    },
    orderBy: [{ topic: "asc" }, { id: "asc" }],
  });
}
