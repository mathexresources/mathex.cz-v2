import type { Faq } from '@/payload-types'

/** Otázky a odpovědi jako rozbalovací seznam (funguje i bez JavaScriptu). */
export function FaqList({ faqs }: { faqs: Pick<Faq, 'id' | 'question' | 'answer'>[] }) {
  if (!faqs.length) return null
  return (
    <div className="border-t border-line">
      {faqs.map((f) => (
        <details key={f.id} className="group border-b border-line">
          <summary className="ui flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.15rem] font-semibold [&::-webkit-details-marker]:hidden">
            <span>{f.question}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="mt-1.5 h-4 w-4 flex-none transition-transform duration-200 group-open:rotate-45"
            >
              <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" />
            </svg>
          </summary>
          <div className="pb-6 pr-10 text-pencil">
            {f.answer.split(/\n{2,}/).map((para, i) => (
              <p key={i} className={i ? 'mt-3' : undefined}>
                {para}
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}
