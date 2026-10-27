"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { FaqDTO } from "@/lib/types";
import { Card } from "@/components/ui";

export default function FaqSection({ faqs }: { faqs: FaqDTO[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const topics = useMemo(() => [...new Set(faqs.map((f) => f.topic))], [faqs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (f) =>
        (!topic || f.topic === topic) &&
        (!q ||
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.topic.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.includes(q))),
    );
  }, [faqs, query, topic]);

  if (faqs.length === 0) {
    return <Card className="text-sm text-slate-600">No FAQ topics have been loaded into the database yet.</Card>;
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition ${
      active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <Card>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, e.g. DSTI, fees, early repayment"
          aria-label="Search FAQ"
          maxLength={200}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        <button type="button" className={chip(topic === null)} onClick={() => setTopic(null)} aria-pressed={topic === null}>
          All topics
        </button>
        {topics.map((t) => (
          <button key={t} type="button" className={chip(topic === t)} onClick={() => setTopic(t)} aria-pressed={topic === t}>
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No questions match your search.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {visible.map((f) => {
            const isOpen = open === f.id;
            return (
              <li key={f.id}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${f.id}`}
                    className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <span>
                      <span className="mb-0.5 block text-xs font-medium text-indigo-700">{f.topic}</span>
                      <span className="block text-sm font-medium text-slate-900">{f.question}</span>
                    </span>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-${f.id}`} className="px-4 pb-4 text-sm leading-relaxed text-slate-700">
                    {f.answer}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
