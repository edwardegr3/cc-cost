import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/db";
import { productToDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(products.map(productToDTO));
  });
}
