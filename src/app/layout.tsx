import type { Metadata, Viewport } from "next";
import { Compass, ShieldAlert, Info } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credit Compass",
  description: "Understand the real cost of credit before you apply. Educational tool – not a lending decision.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

const NAV = [
  { href: "#calculator", label: "Calculator" },
  { href: "#compare", label: "Compare" },
  { href: "#faq", label: "FAQ" },
  { href: "#assistant", label: "Assistant" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Compass className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Credit Compass</h1>
                <p className="text-sm text-slate-600">Understand the real cost of credit before you apply</p>
              </div>
            </div>
            <div
              className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 md:self-center"
              role="note"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
              Educational tool – not a lending decision
            </div>
          </div>
        </header>
        <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur" aria-label="Sections">
            <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
        </nav>

        <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl gap-3 px-4 py-6 text-sm text-slate-600 sm:px-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <div className="space-y-1">
              <p>
                <strong className="font-semibold text-slate-800">Privacy notice:</strong> Do not enter personal or
                confidential information such as your name, personal identification code, bank account or card details.
                Chat messages are stored in this demo&apos;s database.
              </p>
              <p>
                Credit Compass is for education and demonstration only. All products are synthetic examples, all results
                are estimates, and nothing here is financial advice or a lending decision.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-100">
            <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
              © 2026 Consumer Credit Cost. Built with Claude Code
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
