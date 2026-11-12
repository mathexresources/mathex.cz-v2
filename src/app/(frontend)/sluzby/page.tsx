import type { Metadata } from 'next'
import Link from 'next/link'

import { ClosingCta } from '@/components/ClosingCta'
import { PageHeader } from '@/components/PageHeader'
import { getServices, getSiteSettings } from '@/lib/data'
import { serviceHref } from '@/lib/segments'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Služby – weby na míru',
  description: 'Rychlé a bezpečné weby na míru pro firmy, živnostníky i organizace. S administrací a pevnou cenou.',
  path: '/sluzby',
})

export default async function ServicesPage() {
  const [services, site] = await Promise.all([getServices(), getSiteSettings()])
  return (
    <>
      <PageHeader
        title="Co pro vás můžu udělat"
        intro="Postavím vám rychlý a bezpečný web na míru – s administrací, ve které si všechno upravíte sami."
        crumbs={[{ name: 'Služby', path: '/sluzby' }]}
      />
      <div className="container-site mt-14">
        <ul>
          {services.map((s) => (
            <li key={s.id} className="group relative border-b border-ink py-8">
              <h2 className="transition-colors group-hover:text-tape">
                <Link href={serviceHref(s)} className="no-underline after:absolute after:inset-0">
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
