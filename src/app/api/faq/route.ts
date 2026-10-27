import { NextRequest, NextResponse } from "next/server";
import { searchFaq } from "@/lib/faq";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const faqs = await searchFaq(req.nextUrl.searchParams.get("q") ?? undefined);
  return NextResponse.json(faqs);
}
