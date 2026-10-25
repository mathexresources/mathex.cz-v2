import type { Metadata } from 'next'
import Link from 'next/link'

import { ClosingCta } from '@/components/ClosingCta'
import { PageHeader } from '@/components/PageHeader'
import { getServices, getSiteSettings } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Služby – weby na míru podle oboru',
  description:
    'Weby pro řemeslníky, restaurace, kavárny, salony a další malé firmy. Každý obor potřebuje něco jiného – podívejte se, co dostanete.',
  path: '/sluzby',
})

export default async function ServicesPage() {
  const [services, site] = await Promise.all([getServices(), getSiteSettings()])
  return (
    <>
      <PageHeader
        title="Weby podle toho, co děláte"
        intro="Řemeslník potřebuje, aby mu zákazník rychle zavolal. Restaurace potřebuje menu a rezervace stolů. Vyberte si svůj obor."
        crumbs={[{ name: 'Služby', path: '/sluzby' }]}
      />
      <div className="container-site mt-14">
        <ul className="border-t border-line">
          {services.map((s) => (
            <li key={s.id} className="group relative border-b border-line py-8">
              <h2 className="text-[2rem]">
                <Link
                  href={`/sluzby/${s.slug}`}
                  className="no-underline after:absolute after:inset-0 group-hover:underline group-hover:decoration-tape group-hover:decoration-[3px]"
                >
                  {s.title}
                </Link>
              </h2>
              <p className="mt-2 max-w-[60ch] text-pencil">{s.shortDescription}</p>
            </li>
          ))}
        </ul>
      </div>
      <ClosingCta phone={site.phone} />
    </>
  )
}
