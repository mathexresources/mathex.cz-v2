import type { Metadata } from 'next'
import Link from 'next/link'

import { ClosingCta } from '@/components/ClosingCta'
import { FaqList } from '@/components/FaqList'
import { JsonLd } from '@/components/JsonLd'
import { PackageList } from '@/components/PackageList'
import { ProjectList } from '@/components/ProjectList'
import { Section } from '@/components/Section'
import { SpeedMeter } from '@/components/SpeedMeter'
import { TestimonialList } from '@/components/TestimonialList'
import {
  getFaqs,
  getHomePage,
  getPackages,
  getProjects,
  getServices,
  getSiteSettings,
  getTestimonials,
} from '@/lib/data'
import { faqSchema, offerCatalogSchema } from '@/lib/schema'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [home, site] = await Promise.all([getHomePage(), getSiteSettings()])
  return buildMetadata({
    title: `${site.brandName} – ${site.tagline}`,
    description: site.defaultDescription || home.heroText,
    path: '/',
    meta: home.meta,
    image: site.defaultOgImage,
    absoluteTitle: true,
  })
}

export default async function HomePage() {
  const [home, site, services, projects, packages, testimonials, faqs] = await Promise.all([
    getHomePage(),
    getSiteSettings(),
    getServices(),
    getProjects({ featured: true }),
    getPackages(),
    getTestimonials(3),
    getFaqs({ onlyFaqPage: true, limit: 5 }),
  ])

  return (
    <>
      {/* Úvod */}
      <section className="blueprint-grid border-b border-line">
        <div className="container-site grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16 lg:py-24">
          <div>
            <h1 className="max-w-[17ch]">{home.heroTitle}</h1>
            <p className="mt-6 max-w-[54ch] text-[1.2rem] text-pencil">{home.heroText}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/rezervace" className="btn btn-primary">
                Rezervovat konzultaci zdarma
              </Link>
              <Link href="/sluzby/prednasky-bezpecnost-na-internetu" className="btn btn-secondary">
                Přednášky o bezpečnosti
              </Link>
            </div>
          </div>
          <SpeedMeter />
        </div>
      </section>

      {/* Pro koho */}
      {services.length > 0 && (
        <Section id="sluzby" title="Co dělám">
          <ul className="border-t border-line">
            {services.map((s) => (
              <li key={s.id} className="group relative border-b border-line">
                <div className="grid gap-2 py-7 md:grid-cols-[1fr_1.2fr_auto] md:items-baseline md:gap-10">
                  <h3 className="text-[1.75rem] sm:text-[2rem]">
                    <Link
                      href={`/sluzby/${s.slug}`}
                      className="no-underline after:absolute after:inset-0 group-hover:underline group-hover:decoration-tape group-hover:decoration-[3px]"
                    >
                      {s.title}
                    </Link>
                  </h3>
                  <p className="text-pencil">{s.shortDescription}</p>
                  <span aria-hidden="true" className="ui hidden text-2xl transition-transform group-hover:translate-x-1 md:block">
                    ⟶
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Ukázky */}
      <Section
        id="prace"
        title="Ukázky prací"
        intro="U každého webu uvádím, jak dlouho trval a jak rychle se načítá na mobilu. Čísla si můžete ověřit v Google PageSpeed."
        link={{ href: '/portfolio', label: 'Celé portfolio' }}
      >
        <ProjectList projects={projects.slice(0, 3)} />
      </Section>

      {/* Postup */}
      {home.process && home.process.length > 0 && (
        <Section id="postup" title="Jak vzniká web">
          <ol className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {home.process.map((step, i) => (
              <li key={step.id ?? i} className="flex flex-col bg-paper p-6">
                <span className="ui text-[2.5rem] font-bold leading-none text-tape [-webkit-text-stroke:1px_var(--color-ink)]">
                  {i + 1}
                </span>
                <h3 className="mt-5">{step.title}</h3>
                <p className="mt-2 text-[1rem] text-pencil">{step.text}</p>
                {step.duration && <p className="ui mt-auto pt-5 text-[0.9rem] font-semibold">{step.duration}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Ceník */}
      {packages.length > 0 && (
        <Section
          id="cenik"
          title="Kolik stojí web"
          intro="Pevná cena předem, žádné hodinovky. Doménu, hosting i kód máte na sebe, nic vám nedržím jako rukojmí. Přednášky naceňuji podle domluvy."
          link={{ href: '/cenik', label: 'Podrobný ceník' }}
        >
          <PackageList packages={packages} />
          <JsonLd data={offerCatalogSchema(packages)} />
        </Section>
      )}

      {/* Reference */}
      {testimonials.length > 0 && (
        <Section id="reference" title="Co říkají klienti">
          <TestimonialList items={testimonials} />
        </Section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <Section id="otazky" title="Na co se lidé ptají" link={{ href: '/faq', label: 'Všechny otázky' }}>
          <div className="max-w-3xl">
            <FaqList faqs={faqs} />
          </div>
          <JsonLd data={faqSchema(faqs)} />
        </Section>
      )}

      <ClosingCta title={home.closingTitle} text={home.closingText} phone={site.phone} />
    </>
  )
}
