import type { Metadata } from 'next'
import Link from 'next/link'

import { ClosingCta } from '@/components/ClosingCta'
import { FaqList } from '@/components/FaqList'
import { JsonLd } from '@/components/JsonLd'
import { PackageList } from '@/components/PackageList'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getFaqs, getPackages, getSiteSettings } from '@/lib/data'
import { faqSchema, offerCatalogSchema } from '@/lib/schema'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Ceník tvorby webu',
  description: 'Kolik stojí web na míru. Pevné ceny, jasné termíny, žádné skryté poplatky. Přednášky o bezpečnosti podle domluvy.',
  path: '/cenik',
})

const ALWAYS_INCLUDED = [
  'Design na míru, žádná šablona',
  'Mobilní verze a rychlost 90+ v Google PageSpeed',
  'Základní SEO: nadpisy, popisy, sitemapa, strukturovaná data',
  'Napojení na Google Business Profile a Firmy.cz',
  'Zásady ochrany osobních údajů a údaje podnikatele v patičce',
  'Administrace, ve které si texty upravíte sami',
  'Zaškolení na 30 minut a měsíc podpory zdarma',
  'Doména, hosting i zdrojový kód patří vám',
]

export default async function PricingPage() {
  const [packages, lecturePackages, faqs, site] = await Promise.all([
    getPackages('web'),
    getPackages('prednasky'),
    getFaqs(),
    getSiteSettings(),
  ])
  const priceFaqs = faqs.filter((f) => f.topic === 'cena')

  return (
    <>
      <PageHeader
        title="Ceník webů"
        intro={`Cenu znáte předem a nemění se. Zálohu 50 % platíte až po odsouhlasení návrhu. ${
          site.vatPayer ? 'Ceny jsou bez DPH.' : 'Nejsem plátce DPH, takže cena je konečná.'
        }`}
        crumbs={[{ name: 'Ceník', path: '/cenik' }]}
      />

      <div className="container-site mt-16">
        <PackageList packages={packages} />
      </div>

      <Section id="prednasky" title="Přednášky o bezpečnosti">
        {lecturePackages.length > 0 ? (
          <PackageList packages={lecturePackages} />
        ) : (
          <p className="max-w-[60ch] text-pencil">
            Délka i cena přednášky jsou podle domluvy.{' '}
            <Link href="/kontakt?tema=prednaska">Napište mi, co potřebujete</Link>, a pošlu nabídku.
          </p>
        )}
      </Section>

      <Section id="vzdy" title="V každém webu">
        <ul className="ui grid gap-x-10 border-t border-line text-[1.05rem] sm:grid-cols-2">
          {ALWAYS_INCLUDED.map((item) => (
            <li key={item} className="flex gap-3 border-b border-line py-4">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-1 h-4 w-4 flex-none">
                <path d="M2 8.5 6 12.5 14 3.5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {priceFaqs.length > 0 && (
        <Section id="otazky" title="Otázky k ceně">
          <div className="max-w-3xl">
            <FaqList faqs={priceFaqs} />
          </div>
          <JsonLd data={faqSchema(priceFaqs)} />
        </Section>
      )}

      <JsonLd data={offerCatalogSchema([...packages, ...lecturePackages])} />
      <ClosingCta title="Nevíte, co vybrat?" phone={site.phone} />
    </>
  )
}
