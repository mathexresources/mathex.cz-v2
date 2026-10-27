import type { Metadata } from 'next'
import Link from 'next/link'

import { ContactForm, type ContactTopic } from '@/components/forms/ContactForm'
import { PageHeader } from '@/components/PageHeader'
import { getSiteSettings } from '@/lib/data'
import { env } from '@/lib/env'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return buildMetadata({
    title: 'Kontakt',
    description: `Napište mi nebo zavolejte – web na míru i přednáška o bezpečnosti na internetu. ${site.serviceArea ?? ''}`.trim(),
    path: '/kontakt',
  })
}

const TOPICS: ContactTopic[] = ['web', 'prednaska', 'jine']

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const [site, { tema }] = await Promise.all([getSiteSettings(), searchParams])
  const topic = TOPICS.find((t) => t === tema)
  const address = [site.street, [site.zip, site.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  const direct = [
    { label: 'E-mail', value: site.email, href: `mailto:${site.email}`, event: 'email' },
    site.phone && { label: 'Telefon', value: site.phone, href: `tel:${site.phone.replace(/\s/g, '')}`, event: 'tel' },
  ].filter(Boolean) as { label: string; value: string; href: string; event: string }[]

  return (
    <>
      <PageHeader
        title="Napište mi"
        intro="Ať jde o nový web, nebo přednášku pro vaše lidi. Odpovídám do jednoho pracovního dne."
        crumbs={[{ name: 'Kontakt', path: '/kontakt' }]}
      />

      <div className="container-site mt-12 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <div className="min-w-0 rounded-lg border border-line bg-surface p-5 sm:p-8">
          <ContactForm
            privacyHref="/ochrana-osobnich-udaju"
            source={topic ? `/kontakt?tema=${topic}` : '/kontakt'}
            turnstileSiteKey={env.turnstileSiteKey}
            initialTopic={topic}
          />
        </div>

        <aside className="ui min-w-0 space-y-10" aria-label="Další možnosti kontaktu">
          <section>
            <h2 className="text-[1.05rem] font-bold">Napřímo</h2>
            <ul className="mt-3 border-t border-line">
              {direct.map((d) => (
                <li key={d.label} className="border-b border-line">
                  <a href={d.href} data-umami-event={d.event} className="group flex items-center justify-between gap-4 py-4 no-underline">
                    <span className="min-w-0">
                      <span className="block text-[0.85rem] text-pencil">{d.label}</span>
                      <span className="block text-[1.1rem] font-semibold [overflow-wrap:anywhere] group-hover:underline group-hover:decoration-tape group-hover:decoration-2">
                        {d.value}
                      </span>
                    </span>
                    <span aria-hidden="true" className="flex-none text-pencil transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-l-4 border-tape bg-surface p-5">
            <h2 className="text-[1.05rem] font-bold">Radši si zavoláme?</h2>
            <p className="mt-1.5 text-[0.95rem] text-pencil">
              Konzultace na 30 minut zdarma. Vyberte si termín, který vám sedí.
            </p>
            <Link href="/rezervace" className="btn btn-primary mt-4 w-full">
              Vybrat termín
            </Link>
          </section>

          <section className="text-[0.9rem] text-pencil">
            <h2 className="text-[0.85rem] font-semibold uppercase tracking-wide">Fakturační údaje</h2>
            <p className="mt-2 font-semibold text-ink">{site.ownerName}</p>
            <p>IČO {site.ico}</p>
            {site.vatPayer && site.dic ? <p>DIČ {site.dic}</p> : <p>Neplátce DPH</p>}
            {address && <p>{address}</p>}
            {site.registry && <p className="mt-2">{site.registry}</p>}
            {site.serviceArea && <p className="mt-2">Působím: {site.serviceArea}</p>}
          </section>
        </aside>
      </div>
    </>
  )
}
