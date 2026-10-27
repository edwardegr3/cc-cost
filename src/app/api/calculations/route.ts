import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCost, validateInput, type CostInput } from "@/lib/credit";
import { calculationToDTO, productToDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const calculations = await prisma.calculation.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { product: true },
  });
  return NextResponse.json(calculations.map(calculationToDTO));
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const record = await prisma.product.findUnique({ where: { id: productId } });
  if (!record) return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  const product = productToDTO(record);

  const input: CostInput = {
    amountEur: Number(body.amountEur),
    termMonths: Number(body.termMonths),
    monthlyNetIncomeEur: Number(body.monthlyNetIncomeEur),
    existingDebtEur: Number(body.existingDebtEur ?? 0),
  };
  const error = validateInput(product, input);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const result = calculateCost(product, input);
  const saved = await prisma.calculation.create({
    data: { productId, ...input, ...result },
    include: { product: true },
  });

  return NextResponse.json(calculationToDTO(saved), { status: 201 });
}
