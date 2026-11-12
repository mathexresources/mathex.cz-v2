import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AccentText, plainText } from '@/components/AccentText'
import { ClosingCta } from '@/components/ClosingCta'
import { FaqList } from '@/components/FaqList'
import { JsonLd } from '@/components/JsonLd'
import { PackageList } from '@/components/PackageList'
import { RichText } from '@/components/RichText'
import { Section } from '@/components/Section'
import { getLectureService, getPackages, getSiteSettings } from '@/lib/data'
import { breadcrumbSchema, faqSchema, serviceSchema } from '@/lib/schema'
import { LECTURES_PATH } from '@/lib/segments'
import { buildMetadata } from '@/lib/seo'
import type { Faq } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const service = await getLectureService()
  if (!service) return {}
  return buildMetadata({
    title: service.title,
    description: service.shortDescription,
    path: LECTURES_PATH,
    meta: service.meta,
  })
}

export default async function LecturesPage() {
  const [service, packages, site] = await Promise.all([getLectureService(), getPackages('prednasky'), getSiteSettings()])
  if (!service) notFound()
  const faqs = (service.faqs ?? []).filter((f): f is Faq => typeof f === 'object' && f !== null)

  return (
    <>
      {/* Úvod */}
      <section className="container-site pt-12 sm:pt-16 lg:pt-20">
        <p className="ui text-[1.125rem] font-bold sm:text-[1.25rem]">{service.title}</p>
        <h1 className="mt-4 text-[clamp(2.75rem,1rem+8.4vw,8.25rem)] leading-[1.02] tracking-[-0.035em] sm:leading-[0.97]">
          <AccentText text={service.headline} />
        </h1>
        <div className="mt-10 grid gap-8 border-t-[3px] border-ink pt-8 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <p className="max-w-[56ch] text-[1.25rem] leading-relaxed">{service.intro}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap lg:items-start lg:justify-end">
            <Link href="/kontakt?tema=prednaska" className="btn btn-primary">
              Domluvit přednášku
            </Link>
            <Link href="/rezervace" className="btn btn-secondary">
              Probrat to po telefonu
            </Link>
          </div>
        </div>
      </section>

      {service.painPoints && service.painPoints.length > 0 && (
        <Section id="problem" title="Zní vám to povědomě?">
          <ul className="grid gap-x-10 md:grid-cols-2">
            {service.painPoints.map((p) => (
              <li key={p.id ?? p.text} className="border-b border-line py-5 text-[1.15rem]">
                {p.text}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {service.features && service.features.length > 0 && (
        <Section id="temata" title="O čem mluvím">
          <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {service.features.map((f) => (
              <div key={f.id ?? f.title} className="border-t-[3px] border-ink pt-4">
                <dt className="font-display text-[1.375rem] font-black leading-tight tracking-[-0.02em]">{f.title}</dt>
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

      <Section id="cena" title="Cena">
        {packages.length > 0 ? (
          <PackageList packages={packages} />
        ) : (
          <div className="flex max-w-3xl flex-col gap-5 border-l-4 border-tape bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-pencil">
              Délka i cena jsou podle domluvy – záleží na publiku, tématech a místě. Napište mi, co potřebujete, a pošlu
              nabídku.
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

      <JsonLd data={serviceSchema(service, packages, LECTURES_PATH)} />
      <JsonLd data={breadcrumbSchema([{ name: plainText(service.title), path: LECTURES_PATH }])} />
      <ClosingCta
        title="Domluvíme přednášku?"
        text="Napište mi, pro koho by byla, kolik lidí a kde. Pošlu nabídku a návrh témat. Nebo si rovnou vyberte termín krátkého hovoru."
        phone={site.phone}
      />
    </>
  )
}
