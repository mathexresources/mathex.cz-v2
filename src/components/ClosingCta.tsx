import Link from 'next/link'

export function ClosingCta({
  title = 'Pojďme se na váš web podívat spolu',
  text = 'Úvodní konzultace trvá 30 minut a je zdarma. Řeknete mi, co děláte a co od webu chcete, já vám řeknu, co to bude stát a kdy to bude hotové.',
  phone,
}: {
  title?: string | null
  text?: string | null
  phone?: string | null
}) {
  return (
    <section className="container-site mt-28" aria-labelledby="cta-title">
      <div className="grid gap-8 border-t-4 border-tape bg-ink px-6 py-12 text-paper sm:px-10 md:grid-cols-[1.4fr_1fr] md:items-end md:py-16">
        <div>
          <h2 id="cta-title" className="max-w-[18ch]">
            {title}
          </h2>
          <p className="mt-4 max-w-[52ch] opacity-85">{text}</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <Link href="/rezervace" className="btn w-full border-tape bg-tape text-on-tape hover:bg-paper hover:text-ink md:w-auto">
            Vybrat termín konzultace
          </Link>
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="ui text-[1rem] text-paper/85 underline decoration-tape underline-offset-4 hover:text-paper"
            >
              nebo zavolejte na {phone}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
