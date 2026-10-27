"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, Trophy } from "lucide-react";
import { calculateLoan, type LoanResult } from "@/lib/credit";
import type { ProductDTO } from "@/lib/types";
import { Card, EstimateBadge, eur } from "@/components/ui";

const MAX_SELECTED = 3;

export default function ProductComparison({ products }: { products: ProductDTO[] }) {
  const [amount, setAmount] = useState("1500");
  const [term, setTerm] = useState("12");
  const [selected, setSelected] = useState<string[]>(products.slice(0, 2).map((p) => p.id));

  const amountNum = Number(amount);
  const termNum = Number(term);
  const inputError =
    amount.trim() === "" || !Number.isFinite(amountNum) || amountNum <= 0
      ? "Enter a loan amount greater than 0."
      : term.trim() === "" || !Number.isInteger(termNum) || termNum < 1 || termNum > 480
        ? "Enter a whole-number term between 1 and 480 months."
        : null;

  const rows = useMemo(() => {
    if (inputError) return [];
    return selected
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is ProductDTO => !!p)
      .map((p) => ({
        product: p,
        result: calculateLoan({
          amountEur: amountNum,
          termMonths: termNum,
          nominalRatePct: p.nominalRatePct,
          contractFeeEur: p.setupFeeEur,
          monthlyFeeEur: p.monthlyFeeEur,
        }),
        outOfRange:
          amountNum < p.minAmountEur ||
          amountNum > p.maxAmountEur ||
          termNum < p.minTermMonths ||
          termNum > p.maxTermMonths,
      }));
  }, [selected, products, amountNum, termNum, inputError]);

  if (products.length === 0) {
    return <Card className="text-sm text-slate-600">No products have been loaded into the database yet.</Card>;
  }

  // Only products that allow this amount and term can be the "lowest total".
  const eligible = rows.filter((r) => !r.outOfRange);
  const lowestTotal = rows.length >= 2 && eligible.length > 0 ? Math.min(...eligible.map((r) => r.result.totalRepaymentEur)) : null;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_SELECTED ? [...s, id] : s));
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="cmp-amount" label="Loan amount" suffix="€" value={amount} onChange={setAmount} />
          <NumberInput id="cmp-term" label="Term" suffix="months" value={term} onChange={setTerm} />
        </div>
        {inputError && <p className="mt-2 text-xs text-rose-600">{inputError}</p>}

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-slate-700">
            Choose 2–3 products <span className="font-normal text-slate-500">({selected.length} selected)</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const checked = selected.includes(p.id);
              const disabled = !checked && selected.length >= MAX_SELECTED;
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-indigo-300 ${
                    checked ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"
                  } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(p.id)}
                  />
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                    }`}
                    aria-hidden
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span>
                    <span className="block font-medium text-slate-900">{p.name}</span>
                    <span className="block text-xs text-slate-500">
                      {p.type} · {p.nominalRatePct}% · {eur.format(p.minAmountEur)}–{eur.format(p.maxAmountEur)} ·{" "}
                      {p.minTermMonths}–{p.maxTermMonths} mo
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {selected.length < 2 && <p className="mt-2 text-xs text-slate-500">Select at least 2 products to compare.</p>}
        </fieldset>
      </Card>

      {!inputError && rows.length >= 2 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              {eur.format(amountNum)} over {termNum} months
            </h3>
            <EstimateBadge />
          </div>
          <div className={`grid gap-4 ${rows.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {rows.map(({ product, result, outOfRange }) => (
              <ProductCard
                key={product.id}
                product={product}
                result={result}
                outOfRange={outOfRange}
                lowest={!outOfRange && result.totalRepaymentEur === lowestTotal}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">
            All results are estimates for synthetic example products, using a fixed nominal rate and equal monthly
            payments. They are not offers and not lending decisions.
          </p>
        </>
      )}
    </div>
  );
}

function ProductCard({
  product,
  result,
  outOfRange,
  lowest,
}: {
  product: ProductDTO;
  result: LoanResult;
  outOfRange: boolean;
  lowest: boolean;
}) {
  const rows = [
    ["Est. monthly payment", eur.format(result.monthlyPaymentEur)],
    ["Est. total fees", eur.format(result.totalFeesEur)],
    ["Est. total interest", eur.format(result.totalInterestEur)],
    ["Est. total repayment", eur.format(result.totalRepaymentEur)],
  ];
  return (
    <Card className={lowest ? "ring-2 ring-emerald-300" : ""}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{product.name}</p>
          <p className="text-xs text-slate-500">
            {product.nominalRatePct}% nominal · setup {eur.format(product.setupFeeEur)} · {eur.format(product.monthlyFeeEur)}/mo
          </p>
        </div>
        {lowest && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            <Trophy className="h-3 w-3" aria-hidden />
            Lowest total
          </span>
        )}
      </div>
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="text-slate-600">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {outOfRange && (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          This amount or term is outside the product&apos;s example range ({eur.format(product.minAmountEur)}–
          {eur.format(product.maxAmountEur)}, {product.minTermMonths}–{product.maxTermMonths} months).
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">{product.notes}</p>
    </Card>
  );
}

function NumberInput({
  id,
  label,
  suffix,
  value,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-16 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
          {suffix}
        </span>
      </div>
    </div>
  );
}
