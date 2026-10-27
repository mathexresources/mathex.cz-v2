import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ClosingCta } from '@/components/ClosingCta'
import { FaqList } from '@/components/FaqList'
import { JsonLd } from '@/components/JsonLd'
import { PackageList } from '@/components/PackageList'
import { PageHeader } from '@/components/PageHeader'
import { ProjectList } from '@/components/ProjectList'
import { RichText } from '@/components/RichText'
import { Section } from '@/components/Section'
import { getPackages, getProjects, getServiceBySlug, getSiteSettings } from '@/lib/data'
import { faqSchema, serviceSchema } from '@/lib/schema'
import { buildMetadata } from '@/lib/seo'
import { packageCategoryFor } from '@/lib/segments'
import type { Faq } from '@/payload-types'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) return {}
  return buildMetadata({
    title: service.title,
    description: service.shortDescription,
    path: `/sluzby/${service.slug}`,
    meta: service.meta,
  })
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) notFound()

  const isLecture = service.segment === 'bezpecnost'
  const [projects, packages, site] = await Promise.all([
    // Weby na míru ukazují celé portfolio, přednášky žádné weby
    isLecture ? Promise.resolve([]) : getProjects(service.segment === 'weby' ? {} : { segment: service.segment }),
    getPackages(packageCategoryFor(service.segment)),
    getSiteSettings(),
  ])
  const faqs = (service.faqs ?? []).filter((f): f is Faq => typeof f === 'object' && f !== null)

  return (
    <>
      <PageHeader
        title={service.headline}
        intro={service.intro}
        crumbs={[
          { name: 'Služby', path: '/sluzby' },
          { name: service.title, path: `/sluzby/${service.slug}` },
        ]}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isLecture ? (
            <>
              <Link href="/kontakt?tema=prednaska" className="btn btn-primary">
                Domluvit přednášku
              </Link>
              <Link href="/rezervace" className="btn btn-secondary">
                Probrat to po telefonu
              </Link>
            </>
          ) : (
            <>
              <Link href="/rezervace" className="btn btn-primary">
                Rezervovat konzultaci zdarma
              </Link>
              <Link href="#cenik" className="btn btn-secondary">
                Zobrazit ceny
              </Link>
            </>
          )}
        </div>
      </PageHeader>

      {service.painPoints && service.painPoints.length > 0 && (
        <Section id="problem" title="Zní vám to povědomě?">
          <ul className="grid gap-x-10 border-t border-line md:grid-cols-2">
            {service.painPoints.map((p) => (
              <li key={p.id ?? p.text} className="border-b border-line py-5 text-[1.15rem]">
                {p.text}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {service.features && service.features.length > 0 && (
        <Section id="co-umi" title={isLecture ? 'O čem mluvím' : 'Co váš nový web bude umět'}>
          <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {service.features.map((f) => (
              <div key={f.id ?? f.title} className="border-t-2 border-ink pt-4">
                <dt className="ui text-[1.2rem] font-bold">{f.title}</dt>
                <dd className="mt-2 text-[1rem] text-pencil">{f.text}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {service.body && (
        <div className="container-site mt-20">
          <RichText data={service.body} />
        </div>
      )}

      {projects.length > 0 && (
        <Section id="ukazky" title="Ukázky prací" link={{ href: '/portfolio', label: 'Celé portfolio' }}>
          <ProjectList projects={projects.slice(0, 3)} />
        </Section>
      )}

      <Section id="cenik" title="Cena" link={isLecture ? undefined : { href: '/cenik', label: 'Podrobný ceník' }}>
        {packages.length > 0 ? (
          <PackageList packages={packages} />
        ) : (
          <div className="flex max-w-3xl flex-col gap-5 border-l-4 border-tape bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-pencil">
              Délka i cena jsou podle domluvy – záleží na publiku, tématech a místě. Napište mi, co potřebujete, a pošlu nabídku.
            </p>
            <Link href="/kontakt?tema=prednaska" className="btn btn-primary flex-none">
              Poptat přednášku
            </Link>
          </div>
        )}
      </Section>

      {faqs.length > 0 && (
        <Section id="otazky" title="Časté otázky">
          <div className="max-w-3xl">
            <FaqList faqs={faqs} />
          </div>
          <JsonLd data={faqSchema(faqs)} />
        </Section>
      )}

      <JsonLd data={serviceSchema(service, packages)} />
      <ClosingCta phone={site.phone} />
    </>
  )
}
