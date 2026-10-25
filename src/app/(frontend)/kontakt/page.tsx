import type { Metadata } from 'next'
import Link from 'next/link'

import { ContactForm } from '@/components/forms/ContactForm'
import { PageHeader } from '@/components/PageHeader'
import { getSiteSettings } from '@/lib/data'
import { env } from '@/lib/env'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return buildMetadata({
    title: 'Kontakt',
    description: `Napište mi nebo zavolejte. ${site.serviceArea ?? ''}`.trim(),
    path: '/kontakt',
  })
}

export default async function ContactPage() {
  const site = await getSiteSettings()
  const address = [site.street, [site.zip, site.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <>
      <PageHeader
        title="Napište mi"
        intro="Odpovídám do jednoho pracovního dne. Když to spěchá, zavolejte nebo si rovnou vyberte termín konzultace."
        crumbs={[{ name: 'Kontakt', path: '/kontakt' }]}
      />
      <div className="container-site mt-14 grid gap-16 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-3xl">
          <ContactForm privacyHref="/ochrana-osobnich-udaju" source="/kontakt" turnstileSiteKey={env.turnstileSiteKey} />
        </div>

        <aside className="ui space-y-8 lg:border-l lg:border-line lg:pl-8">
          <dl className="space-y-5 text-[1rem]">
            <div>
              <dt className="text-[0.85rem] text-pencil">E-mail</dt>
              <dd className="mt-0.5 text-[1.15rem] font-semibold">
                <a href={`mailto:${site.email}`} data-umami-event="email">{site.email}</a>
              </dd>
            </div>
            {site.phone && (
              <div>
                <dt className="text-[0.85rem] text-pencil">Telefon</dt>
                <dd className="mt-0.5 text-[1.15rem] font-semibold">
                  <a href={`tel:${site.phone.replace(/\s/g, '')}`} data-umami-event="tel">{site.phone}</a>
                </dd>
              </div>
            )}
            {site.serviceArea && (
              <div>
                <dt className="text-[0.85rem] text-pencil">Kde působím</dt>
                <dd className="mt-0.5">{site.serviceArea}</dd>
              </div>
            )}
          </dl>

          <Link href="/rezervace" className="btn btn-primary w-full">
            Vybrat termín konzultace
          </Link>

          <div className="border-t border-line pt-6 text-[0.9rem] text-pencil">
            <p className="font-semibold text-ink">{site.ownerName}</p>
            <p>IČO {site.ico}</p>
            {site.vatPayer && site.dic && <p>DIČ {site.dic}</p>}
            {address && <p>{address}</p>}
            <p className="mt-2">{site.registry}</p>
          </div>
        </aside>
      </div>
    </>
  )
}
