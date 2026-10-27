import Link from 'next/link'

import { GuillocheMedallion } from './Guilloche'

export function ClosingCta({
  title = 'Pojďme to probrat',
  text = 'Úvodní konzultace trvá 30 minut a je zdarma.',
  phone,
}: {
  title?: string | null
  text?: string | null
  phone?: string | null
}) {
  return (
    <section className="container-site mt-28" aria-labelledby="cta-title">
      <div className="relative isolate overflow-hidden rounded-[3px] bg-ink px-6 py-12 text-paper sm:px-10 md:py-16">
        {/* tlumený medailon v rohu – stejný ochranný prvek jako v úvodu */}
        <GuillocheMedallion
          id="vyzva"
          className="pointer-events-none absolute -right-28 -top-24 -z-10 w-[30rem] opacity-40 [--color-iris-a:#4db8ac] [--color-iris-b:#b496f0] [--color-pencil:transparent] md:-right-16"
        />
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 id="cta-title" className="max-w-[18ch]">
              {title}
            </h2>
            <p className="mt-4 max-w-[52ch] opacity-85">{text}</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link
              href="/rezervace"
              className="btn w-full border-paper bg-paper text-ink hover:border-accent hover:bg-accent hover:text-on-accent md:w-auto"
            >
              Vybrat termín konzultace
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-[1rem] text-paper/85 underline underline-offset-4 hover:text-paper">
                nebo zavolejte na {phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
