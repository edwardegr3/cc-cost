import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productToDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(products.map(productToDTO));
}
