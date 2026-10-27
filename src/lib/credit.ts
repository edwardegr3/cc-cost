// Educational credit cost & affordability calculations.
// Results are estimates and indicators, never lending decisions.

export const DSTI_WARNING_PCT = 40;

export type LoanInput = {
  amountEur: number;
  termMonths: number;
  nominalRatePct: number;
  contractFeeEur: number;
  monthlyFeeEur: number;
};

export type LoanResult = {
  monthlyInstalmentEur: number; // principal + interest
  monthlyPaymentEur: number; // instalment + monthly administration fee
  totalInterestEur: number;
  totalFeesEur: number;
  totalRepaymentEur: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// Annuity instalment (principal + interest) for a fixed-rate loan.
export function annuityPayment(amount: number, annualRatePct: number, termMonths: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r) / (1 - Math.pow(1 + r, -termMonths));
}

export function calculateLoan(input: LoanInput): LoanResult {
  const instalment = annuityPayment(input.amountEur, input.nominalRatePct, input.termMonths);
  const totalInterest = instalment * input.termMonths - input.amountEur;
  const totalFees = input.contractFeeEur + input.monthlyFeeEur * input.termMonths;
  return {
    monthlyInstalmentEur: round2(instalment),
    monthlyPaymentEur: round2(instalment + input.monthlyFeeEur),
    totalInterestEur: round2(totalInterest),
    totalFeesEur: round2(totalFees),
    totalRepaymentEur: round2(input.amountEur + totalInterest + totalFees),
  };
}

// DSTI % = (existing monthly debt payments + new monthly payment) / monthly net income
export function calculateDsti(existingDebtEur: number, newMonthlyPaymentEur: number, monthlyNetIncomeEur: number) {
  return round2(((existingDebtEur + newMonthlyPaymentEur) / monthlyNetIncomeEur) * 100);
}

export type CalculatorFields = {
  amountEur: string;
  termMonths: string;
  nominalRatePct: string;
  contractFeeEur: string;
  monthlyFeeEur: string;
  monthlyNetIncomeEur: string;
  existingDebtEur: string;
};

export type FieldErrors = Partial<Record<keyof CalculatorFields, string>>;

export const LIMITS = {
  maxAmountEur: 1_000_000,
  maxTermMonths: 480,
  maxRatePct: 100,
  maxFeeEur: 100_000,
  maxIncomeEur: 1_000_000,
};

function parseField(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

// Returns parsed numbers or per-field error messages.
export function validateCalculator(
  fields: CalculatorFields,
): { ok: true; values: Record<keyof CalculatorFields, number> } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const values = {} as Record<keyof CalculatorFields, number>;

  // Fees and existing debt are optional: blank means 0.
  const rules: Record<
    keyof CalculatorFields,
    { label: string; min: number; minExclusive?: boolean; max: number; integer?: boolean; optional?: boolean }
  > = {
    amountEur: { label: "Loan amount", min: 0, minExclusive: true, max: LIMITS.maxAmountEur },
    termMonths: { label: "Term", min: 1, max: LIMITS.maxTermMonths, integer: true },
    nominalRatePct: { label: "Interest rate", min: 0, max: LIMITS.maxRatePct },
    contractFeeEur: { label: "Contract fee", min: 0, max: LIMITS.maxFeeEur, optional: true },
    monthlyFeeEur: { label: "Monthly fee", min: 0, max: LIMITS.maxFeeEur, optional: true },
    monthlyNetIncomeEur: { label: "Monthly net income", min: 0, minExclusive: true, max: LIMITS.maxIncomeEur },
    existingDebtEur: { label: "Existing debt payments", min: 0, max: LIMITS.maxIncomeEur, optional: true },
  };

  for (const key of Object.keys(rules) as (keyof CalculatorFields)[]) {
    const rule = rules[key];
    const n = parseField(fields[key]) ?? (rule.optional ? 0 : null);
    if (n === null) errors[key] = `${rule.label} is required.`;
    else if (Number.isNaN(n)) errors[key] = `${rule.label} must be a number.`;
    else if (n < 0) errors[key] = `${rule.label} cannot be negative.`;
    else if (rule.minExclusive && n <= rule.min) errors[key] = `${rule.label} must be greater than ${rule.min}.`;
    else if (n < rule.min) errors[key] = `${rule.label} must be at least ${rule.min}.`;
    else if (n > rule.max) errors[key] = `${rule.label} cannot exceed ${rule.max.toLocaleString("en-GB")}.`;
    else if (rule.integer && !Number.isInteger(n)) errors[key] = `${rule.label} must be a whole number of months.`;
    else values[key] = n;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}
