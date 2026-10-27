import { DatabaseZap } from "lucide-react";

export const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

export function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-14" aria-labelledby={`${id}-title`}>
      <div className="mb-4">
        <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</div>;
}

export function DbErrorNotice({ what, message }: { what?: string; message?: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
      <DatabaseZap className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">We can&apos;t reach the database right now.</p>
        <p>
          {message ??
            `${what ? `The ${what} can't be shown at the moment. ` : ""}The calculator still works. Please refresh the page in a little while.`}
        </p>
      </div>
    </div>
  );
}

export function EstimateBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      Estimate
    </span>
  );
}
