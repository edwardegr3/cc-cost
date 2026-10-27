import { prisma } from "@/lib/prisma";
import { calculationToDTO, productToDTO } from "@/lib/serialize";
import Calculator from "@/components/Calculator";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, calculations] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    prisma.calculation.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { product: true } }),
  ]);

  return (
    <>
      <h1>Credit cost &amp; affordability</h1>
      <p className="hint">
        Compare what a loan really costs, including fees, and estimate your debt-service-to-income ratio (DSTI).
      </p>
      {products.length === 0 ? (
        <div className="card">
          No products in the database yet. Run <code>npm run db:seed</code> against the Render database.
        </div>
      ) : (
        <Calculator products={products.map(productToDTO)} initialHistory={calculations.map(calculationToDTO)} />
      )}
    </>
  );
}
