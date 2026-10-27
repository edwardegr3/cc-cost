// Educational credit cost & affordability calculations.
// Results are indicators, not lending decisions.

export type ProductTerms = {
  nominalRatePct: number;
  setupFeeEur: number;
  monthlyFeeEur: number;
};

export type CostInput = {
  amountEur: number;
  termMonths: number;
  monthlyNetIncomeEur: number;
  existingDebtEur: number;
};

export type CostResult = {
  monthlyPaymentEur: number;
  totalRepaymentEur: number;
  totalCostEur: number;
  dstiPct: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Annuity instalment (principal + interest) for a fixed-rate loan.
export function annuityPayment(amount: number, annualRatePct: number, termMonths: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r) / (1 - Math.pow(1 + r, -termMonths));
}

export function calculateCost(product: ProductTerms, input: CostInput): CostResult {
  const instalment = annuityPayment(input.amountEur, product.nominalRatePct, input.termMonths);
  const monthlyPayment = instalment + product.monthlyFeeEur;
  const totalRepayment = monthlyPayment * input.termMonths + product.setupFeeEur;
  const totalCost = totalRepayment - input.amountEur;
  // DSTI = (existing monthly debt payments + new monthly payment) / monthly net income
  const dsti =
    input.monthlyNetIncomeEur > 0
      ? ((input.existingDebtEur + monthlyPayment) / input.monthlyNetIncomeEur) * 100
      : 0;

  return {
    monthlyPaymentEur: round2(monthlyPayment),
    totalRepaymentEur: round2(totalRepayment),
    totalCostEur: round2(totalCost),
    dstiPct: round2(dsti),
  };
}

export function validateInput(
  product: { minAmountEur: number; maxAmountEur: number; minTermMonths: number; maxTermMonths: number },
  input: CostInput,
): string | null {
  const { amountEur, termMonths, monthlyNetIncomeEur, existingDebtEur } = input;
  if (![amountEur, termMonths, monthlyNetIncomeEur, existingDebtEur].every(Number.isFinite)) {
    return "All fields must be numbers.";
  }
  if (amountEur < product.minAmountEur || amountEur > product.maxAmountEur) {
    return `Amount must be between ${product.minAmountEur} and ${product.maxAmountEur} EUR.`;
  }
  if (!Number.isInteger(termMonths) || termMonths < product.minTermMonths || termMonths > product.maxTermMonths) {
    return `Term must be a whole number between ${product.minTermMonths} and ${product.maxTermMonths} months.`;
  }
  if (monthlyNetIncomeEur <= 0) return "Monthly net income must be greater than 0.";
  if (existingDebtEur < 0) return "Existing monthly debt payments cannot be negative.";
  return null;
}
