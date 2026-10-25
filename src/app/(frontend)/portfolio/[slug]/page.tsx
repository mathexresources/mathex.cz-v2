import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ClosingCta } from '@/components/ClosingCta'
import { CmsImage } from '@/components/CmsImage'
import { PageHeader } from '@/components/PageHeader'
import { RichText } from '@/components/RichText'
import { TestimonialList } from '@/components/TestimonialList'
import { getProjectBySlug, getSiteSettings } from '@/lib/data'
import { pluralDays } from '@/lib/format'
import { segmentLabel } from '@/lib/segments'
import { buildMetadata } from '@/lib/seo'
import type { Testimonial } from '@/payload-types'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  return buildMetadata({
    title: `${project.title} – ${project.client}`,
    description: project.summary,
    path: `/portfolio/${project.slug}`,
    meta: project.meta,
    image: project.cover,
  })
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()
  const site = await getSiteSettings()
  const testimonial =
    project.testimonial && typeof project.testimonial === 'object' ? (project.testimonial as Testimonial) : null

  const facts = [
    { label: 'Klient', value: project.client },
    { label: 'Obor', value: segmentLabel(project.segment) },
    project.deliveredInDays
      ? { label: 'Hotovo za', value: `${project.deliveredInDays} ${pluralDays(project.deliveredInDays)}` }
      : null,
    project.pagespeedMobile ? { label: 'PageSpeed mobil', value: `${project.pagespeedMobile}/100` } : null,
    project.pagespeedDesktop ? { label: 'PageSpeed desktop', value: `${project.pagespeedDesktop}/100` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <PageHeader
        title={project.title}
        intro={project.summary}
        crumbs={[
          { name: 'Portfolio', path: '/portfolio' },
          { name: project.title, path: `/portfolio/${project.slug}` },
        ]}
      >
        {project.isDemo && (
          <p className="ui mt-4 inline-block border border-pencil px-2 py-1 text-[0.9rem] text-pencil">
            Ukázkový projekt pro fiktivní firmu
          </p>
        )}
      </PageHeader>

      <div className="container-site mt-12">
        <dl className="ui grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-3 lg:grid-cols-5">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[0.85rem] text-pencil">{f.label}</dt>
              <dd className="mt-1 text-[1.2rem] font-bold">{f.value}</dd>
            </div>
          ))}
        </dl>

        {project.cover && typeof project.cover === 'object' && (
          <div className="mt-10 border border-line">
            <CmsImage media={project.cover} sizes="(min-width: 1200px) 1184px, 100vw" priority className="h-auto w-full" />
          </div>
        )}

        <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-14">
            {project.challenge && (
              <section>
                <h2 className="text-[2rem]">Zadání</h2>
                <RichText data={project.challenge} className="mt-4" />
              </section>
            )}
            {project.solution && (
              <section>
                <h2 className="text-[2rem]">Řešení</h2>
                <RichText data={project.solution} className="mt-4" />
              </section>
            )}
            {project.result && (
              <section>
                <h2 className="text-[2rem]">Výsledek</h2>
                <RichText data={project.result} className="mt-4" />
              </section>
            )}
          </div>

          <aside className="ui space-y-8 lg:sticky lg:top-24 lg:self-start">
            {project.stack && project.stack.length > 0 && (
              <div>
                <h2 className="text-[1.1rem]">Co web umí</h2>
                <ul className="mt-3 space-y-1.5 text-[0.975rem] text-pencil">
                  {project.stack.map((s) => (
                    <li key={s.id ?? s.item}>{s.item}</li>
                  ))}
                </ul>
              </div>
            )}
            {project.url && (
              <a href={project.url} target="_blank" rel="noopener" className="btn btn-secondary w-full">
                Otevřít web
              </a>
            )}
          </aside>
        </div>

        {project.gallery && project.gallery.length > 0 && (
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {project.gallery.map((g, i) => (
              <div key={g.id ?? i} className="border border-line">
                <CmsImage media={g.image} sizes="(min-width: 768px) 50vw, 100vw" className="h-auto w-full" />
              </div>
            ))}
          </div>
        )}

        {testimonial && (
          <div className="mt-20 border-t border-line pt-12">
            <TestimonialList items={[testimonial]} />
          </div>
        )}
      </div>

      <ClosingCta title="Chcete něco podobného?" phone={site.phone} />
    </>
  )
}
