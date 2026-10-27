import { prisma } from "@/lib/prisma";
import { productToDTO } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

export default async function ProductsPage() {
  const products = (await prisma.product.findMany({ orderBy: { id: "asc" } })).map(productToDTO);

  return (
    <>
      <h1>Example credit products</h1>
      <p className="hint">Synthetic examples. A lower nominal rate does not always mean a lower total cost.</p>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th className="num">Rate</th>
              <th className="num">Setup fee</th>
              <th className="num">Monthly fee</th>
              <th className="num">Amount</th>
              <th className="num">Term</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td className="num">{p.nominalRatePct}%</td>
                <td className="num">{eur.format(p.setupFeeEur)}</td>
                <td className="num">{eur.format(p.monthlyFeeEur)}</td>
                <td className="num">
                  {p.minAmountEur}–{p.maxAmountEur} €
                </td>
                <td className="num">
                  {p.minTermMonths}–{p.maxTermMonths} mo
                </td>
                <td>{p.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
