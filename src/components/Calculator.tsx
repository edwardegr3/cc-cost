"use client";

import { useState } from "react";
import type { CalculationDTO, ProductDTO } from "@/lib/serialize";

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function dstiClass(dsti: number) {
  if (dsti < 30) return "dsti-ok";
  if (dsti <= 40) return "dsti-warn";
  return "dsti-high";
}

export default function Calculator({
  products,
  initialHistory,
}: {
  products: ProductDTO[];
  initialHistory: CalculationDTO[];
}) {
  const [productId, setProductId] = useState(products[0].id);
  const product = products.find((p) => p.id === productId) ?? products[0];
  const [amountEur, setAmountEur] = useState(String(product.minAmountEur));
  const [termMonths, setTermMonths] = useState(String(product.minTermMonths));
  const [monthlyNetIncomeEur, setIncome] = useState("1500");
  const [existingDebtEur, setDebt] = useState("0");
  const [result, setResult] = useState<CalculationDTO | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function selectProduct(id: string) {
    const next = products.find((p) => p.id === id);
    if (!next) return;
    setProductId(id);
    setAmountEur(String(next.minAmountEur));
    setTermMonths(String(next.minTermMonths));
    setResult(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          amountEur: Number(amountEur),
          termMonths: Number(termMonths),
          monthlyNetIncomeEur: Number(monthlyNetIncomeEur),
          existingDebtEur: Number(existingDebtEur),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Calculation failed.");
        return;
      }
      setResult(data);
      setHistory((h) => [data, ...h].slice(0, 10));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="card" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            Product
            <select value={productId} onChange={(e) => selectProduct(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.nominalRatePct}%)
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount (EUR)
            <input
              type="number"
              min={product.minAmountEur}
              max={product.maxAmountEur}
              step="any"
              value={amountEur}
              onChange={(e) => setAmountEur(e.target.value)}
              required
            />
            <span className="hint">
              {product.minAmountEur}–{product.maxAmountEur} EUR
            </span>
          </label>
          <label>
            Term (months)
            <input
              type="number"
              min={product.minTermMonths}
              max={product.maxTermMonths}
              step={1}
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              required
            />
            <span className="hint">
              {product.minTermMonths}–{product.maxTermMonths} months
            </span>
          </label>
          <label>
            Monthly net income (EUR)
            <input
              type="number"
              min={1}
              step="any"
              value={monthlyNetIncomeEur}
              onChange={(e) => setIncome(e.target.value)}
              required
            />
          </label>
          <label>
            Existing monthly debt payments (EUR)
            <input
              type="number"
              min={0}
              step="any"
              value={existingDebtEur}
              onChange={(e) => setDebt(e.target.value)}
              required
            />
          </label>
        </div>
        <p className="hint">
          Setup fee {eur.format(product.setupFeeEur)} · Monthly fee {eur.format(product.monthlyFeeEur)} ·{" "}
          {product.notes}
        </p>
        <button type="submit" disabled={busy}>
          {busy ? "Calculating…" : "Calculate & save"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <section className="card" aria-live="polite">
          <h2>Result: {result.productName}</h2>
          <div className="stats">
            <div>
              <div className="stat-label">Monthly payment (incl. fees)</div>
              <div className="stat-value">{eur.format(result.monthlyPaymentEur)}</div>
            </div>
            <div>
              <div className="stat-label">Total repayment</div>
              <div className="stat-value">{eur.format(result.totalRepaymentEur)}</div>
            </div>
            <div>
              <div className="stat-label">Total cost of credit</div>
              <div className="stat-value">{eur.format(result.totalCostEur)}</div>
            </div>
            <div>
              <div className="stat-label">Estimated DSTI</div>
              <div className={`stat-value ${dstiClass(result.dstiPct)}`}>{result.dstiPct.toFixed(1)}%</div>
            </div>
          </div>
          <p className="hint">
            DSTI = (existing monthly debt payments + new monthly payment) ÷ monthly net income. It is an educational
            indicator, not a lending decision.
          </p>
        </section>
      )}

      {history.length > 0 && (
        <section className="card">
          <h2>Recent calculations</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th className="num">Amount</th>
                  <th className="num">Term</th>
                  <th className="num">Monthly</th>
                  <th className="num">Total cost</th>
                  <th className="num">DSTI</th>
                </tr>
              </thead>
              <tbody>
                {history.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.createdAt).toLocaleString("en-GB")}</td>
                    <td>{c.productName}</td>
                    <td className="num">{eur.format(c.amountEur)}</td>
                    <td className="num">{c.termMonths} mo</td>
                    <td className="num">{eur.format(c.monthlyPaymentEur)}</td>
                    <td className="num">{eur.format(c.totalCostEur)}</td>
                    <td className={`num ${dstiClass(c.dstiPct)}`}>{c.dstiPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
