import { searchFaq } from "@/lib/faq";

export const dynamic = "force-dynamic";

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const faqs = await searchFaq(q);

  return (
    <>
      <h1>Credit FAQ</h1>
      <form className="search" action="/faq">
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search, e.g. DSTI, fees, interest" />
        <button type="submit">Search</button>
      </form>
      {faqs.length === 0 && <p className="hint">No matching questions.</p>}
      {faqs.map((f) => (
        <article key={f.id} className="card faq-item">
          <span className="tag">{f.topic}</span>
          <h3>{f.question}</h3>
          <p>{f.answer}</p>
        </article>
      ))}
    </>
  );
}
