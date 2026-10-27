import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/db";
import { faqToDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const faqs = await prisma.faq.findMany({ orderBy: [{ topic: "asc" }, { id: "asc" }] });
    return NextResponse.json(faqs.map(faqToDTO));
  });
}
