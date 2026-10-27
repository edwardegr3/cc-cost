import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credit Compass",
  description: "Consumer Credit Cost & Affordability Education Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Credit Compass
          </Link>
          <nav>
            <Link href="/">Calculator</Link>
            <Link href="/products">Products</Link>
            <Link href="/faq">FAQ</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          Educational tool with synthetic example products. Results are indicators, not lending decisions.
        </footer>
      </body>
    </html>
  );
}
