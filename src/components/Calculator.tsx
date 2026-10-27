"use client";

import { useState } from "react";
import { AlertTriangle, Calculator as CalculatorIcon, RotateCcw } from "lucide-react";
import {
  calculateDsti,
  calculateLoan,
  DSTI_WARNING_PCT,
  validateCalculator,
  type CalculatorFields,
  type FieldErrors,
  type LoanResult,
} from "@/lib/credit";
import { Card, EstimateBadge, eur } from "@/components/ui";

const EMPTY: CalculatorFields = {
  amountEur: "",
  termMonths: "",
  nominalRatePct: "",
  contractFeeEur: "",
  monthlyFeeEur: "",
  monthlyNetIncomeEur: "",
  existingDebtEur: "",
};

const FIELDS: { key: keyof CalculatorFields; label: string; suffix: string; placeholder: string; hint?: string }[] = [
  { key: "amountEur", label: "Loan amount", suffix: "€", placeholder: "e.g. 3000" },
  { key: "termMonths", label: "Term", suffix: "months", placeholder: "e.g. 24" },
  { key: "nominalRatePct", label: "Nominal annual interest rate", suffix: "%", placeholder: "e.g. 12.5" },
  { key: "contractFeeEur", label: "Contract fee", suffix: "€", placeholder: "0", hint: "One-off fee. Leave blank if none." },
  { key: "monthlyFeeEur", label: "Monthly administration fee", suffix: "€", placeholder: "0", hint: "Leave blank if none." },
  { key: "monthlyNetIncomeEur", label: "Monthly net income", suffix: "€", placeholder: "e.g. 1800" },
  { key: "existingDebtEur", label: "Existing monthly debt payments", suffix: "€", placeholder: "0", hint: "Leave blank if none." },
];

type Result = LoanResult & { dstiPct: number };

export default function Calculator() {
  const [fields, setFields] = useState<CalculatorFields>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<Result | null>(null);

  function update(key: keyof CalculatorFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();
    const parsed = validateCalculator(fields);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setResult(null);
      return;
    }
    const v = parsed.values;
    const loan = calculateLoan({
      amountEur: v.amountEur,
      termMonths: v.termMonths,
      nominalRatePct: v.nominalRatePct,
      contractFeeEur: v.contractFeeEur,
      monthlyFeeEur: v.monthlyFeeEur,
    });
    setErrors({});
    setResult({ ...loan, dstiPct: calculateDsti(v.existingDebtEur, loan.monthlyPaymentEur, v.monthlyNetIncomeEur) });
  }

  function onReset() {
    setFields(EMPTY);
    setErrors({});
    setResult(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <form onSubmit={onCalculate} onReset={onReset} noValidate className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="mb-1 block text-sm font-medium text-slate-700">
                {f.label}
              </label>
              <div className="relative">
                <input
                  id={f.key}
                  name={f.key}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  placeholder={f.placeholder}
                  value={fields[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                  aria-describedby={errors[f.key] ? `${f.key}-error` : undefined}
                  className={`w-full rounded-lg border bg-white py-2 pl-3 pr-16 text-sm outline-none transition focus:ring-2 ${
                    errors[f.key]
                      ? "border-rose-400 focus:ring-rose-200"
                      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                  {f.suffix}
                </span>
              </div>
              {errors[f.key] ? (
                <p id={`${f.key}-error`} className="mt-1 text-xs text-rose-600">
                  {errors[f.key]}
                </p>
              ) : (
                f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <CalculatorIcon className="h-4 w-4" aria-hidden />
              Calculate
            </button>
            <button
              type="reset"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset
            </button>
          </div>
        </form>
      </Card>

      <div className="lg:col-span-3" aria-live="polite">
        {result ? (
          <Results result={result} />
        ) : (
          <Card className="flex h-full min-h-48 items-center justify-center text-center text-sm text-slate-500">
            Fill in the loan details and press Calculate to see your estimated costs.
          </Card>
        )}
      </div>
    </div>
  );
}

function Results({ result }: { result: Result }) {
  const high = result.dstiPct > DSTI_WARNING_PCT;
  const kpis = [
    {
      label: "Estimated monthly payment",
      value: eur.format(result.monthlyPaymentEur),
      note: `Annuity instalment ${eur.format(result.monthlyInstalmentEur)} + monthly fee`,
      primary: true,
    },
    { label: "Total interest", value: eur.format(result.totalInterestEur) },
    { label: "Total fees", value: eur.format(result.totalFeesEur), note: "Contract fee + monthly fees" },
    { label: "Total repayment", value: eur.format(result.totalRepaymentEur), note: "Loan amount + interest + fees" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Your results</h3>
        <EstimateBadge />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-4 ${k.primary ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
            {k.note && <p className="mt-1 text-xs text-slate-500">{k.note}</p>}
          </div>
        ))}
        <div
          className={`rounded-2xl border p-4 sm:col-span-2 ${high ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estimated DSTI</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${high ? "text-amber-800" : "text-emerald-800"}`}>
            {result.dstiPct.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-slate-600">
            (Existing monthly debt payments + new estimated monthly payment) ÷ monthly net income
          </p>
        </div>
      </div>
      {high && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Your estimated DSTI is above {DSTI_WARNING_PCT}%.</p>
            <p>
              More than {DSTI_WARNING_PCT}% of your monthly net income would go to debt payments. That leaves less room for
              everyday costs and unexpected expenses. Consider a smaller amount, a longer term or reducing existing
              debt, and review your budget carefully. This is an educational indicator only, not a lending decision.
            </p>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">
        All figures are estimates based on a fixed nominal rate and equal monthly payments. Actual offers, rates and fees
        may differ.
      </p>
    </div>
  );
}
