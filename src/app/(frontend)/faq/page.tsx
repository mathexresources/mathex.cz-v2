import type { Metadata } from 'next'

import { FAQ_TOPICS } from '@/collections/Faqs'
import { ClosingCta } from '@/components/ClosingCta'
import { FaqList } from '@/components/FaqList'
import { JsonLd } from '@/components/JsonLd'
import { PageHeader } from '@/components/PageHeader'
import { getFaqs, getSiteSettings } from '@/lib/data'
import { faqSchema } from '@/lib/schema'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Časté otázky',
  description: 'Kolik stojí web, jak dlouho trvá, co potřebuju dodat, kdo vlastní doménu a co když budu chtít něco změnit.',
  path: '/faq',
})

export default async function FaqPage() {
  const [faqs, site] = await Promise.all([getFaqs({ onlyFaqPage: true }), getSiteSettings()])
  const groups = FAQ_TOPICS.map((t) => ({ ...t, items: faqs.filter((f) => f.topic === t.value) })).filter(
    (g) => g.items.length,
  )

  return (
    <>
      <PageHeader
        title="Časté otázky"
        intro="Nenašli jste odpověď? Napište mi nebo si rovnou zarezervujte krátký hovor."
        crumbs={[{ name: 'Časté otázky', path: '/faq' }]}
      />
      <div className="container-site mt-14">
        <div className="max-w-3xl space-y-16">
          {groups.map((g) => (
            <section key={g.value} aria-labelledby={`faq-${g.value}`}>
              <h2 id={`faq-${g.value}`} className="mb-4 text-[1.75rem]">
                {g.label}
              </h2>
              <FaqList faqs={g.items} />
            </section>
          ))}
        </div>
      </div>
      <JsonLd data={faqSchema(faqs)} />
      <ClosingCta phone={site.phone} />
    </>
  )
}
