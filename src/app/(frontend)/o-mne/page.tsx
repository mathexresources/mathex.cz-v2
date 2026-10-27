import type { Metadata } from 'next'

import { ClosingCta } from '@/components/ClosingCta'
import { CmsImage } from '@/components/CmsImage'
import { PageHeader } from '@/components/PageHeader'
import { RichText } from '@/components/RichText'
import { Section } from '@/components/Section'
import { getAboutPage, getSiteSettings } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [about, site] = await Promise.all([getAboutPage(), getSiteSettings()])
  return buildMetadata({
    title: `O mně – ${site.ownerName}`,
    description: about.headline,
    path: '/o-mne',
    meta: about.meta,
    image: about.photo,
  })
}

export default async function AboutPage() {
  const [about, site] = await Promise.all([getAboutPage(), getSiteSettings()])
  return (
    <>
      <PageHeader title={about.headline} crumbs={[{ name: 'O mně', path: '/o-mne' }]} />

      <div className="container-site mt-14 grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-20">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {about.photo && typeof about.photo === 'object' ? (
            <CmsImage
              media={about.photo}
              sizes="(min-width: 1024px) 320px, 100vw"
              priority
              className="aspect-[4/5] h-auto w-full border border-line object-cover"
            />
          ) : (
            <div className="hatch aspect-[4/5] border border-line" role="img" aria-label="Místo pro fotku" />
          )}
          <p className="ui mt-4 text-[1.2rem] font-bold">{site.ownerName}</p>
          {about.facts && about.facts.length > 0 && (
            <dl className="ui mt-4 space-y-3 border-t border-line pt-4 text-[0.95rem]">
              {about.facts.map((f) => (
                <div key={f.id ?? f.label} className="flex justify-between gap-4">
                  <dt className="text-pencil">{f.label}</dt>
                  <dd className="text-right font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </aside>

        <div>
          {about.body ? (
            <RichText data={about.body} className="text-[1.15rem]" />
          ) : (
            <p className="ui text-pencil">Text o mně doplňte v administraci (Stránky → O mně).</p>
          )}
        </div>
      </div>

      {about.principles && about.principles.length > 0 && (
        <Section id="zasady" title="Jak pracuju">
          <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {about.principles.map((p) => (
              <div key={p.id ?? p.title} className="border-t-2 border-ink pt-4">
                <dt className="ui text-[1.25rem] font-bold">{p.title}</dt>
                <dd className="mt-2 text-pencil">{p.text}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      <ClosingCta phone={site.phone} />
    </>
  )
}
