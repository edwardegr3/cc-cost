import type { Calculation, Product } from "@prisma/client";

// Prisma Decimal values are not JSON-friendly; convert them to numbers.

export type ProductDTO = ReturnType<typeof productToDTO>;
export type CalculationDTO = ReturnType<typeof calculationToDTO>;

export function productToDTO(p: Product) {
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

export function calculationToDTO(c: Calculation & { product?: Product }) {
  return {
    id: c.id,
    productId: c.productId,
    productName: c.product?.name ?? c.productId,
    amountEur: Number(c.amountEur),
    termMonths: c.termMonths,
    monthlyNetIncomeEur: Number(c.monthlyNetIncomeEur),
    existingDebtEur: Number(c.existingDebtEur),
    monthlyPaymentEur: Number(c.monthlyPaymentEur),
    totalRepaymentEur: Number(c.totalRepaymentEur),
    totalCostEur: Number(c.totalCostEur),
    dstiPct: Number(c.dstiPct),
    createdAt: c.createdAt.toISOString(),
  };
}
