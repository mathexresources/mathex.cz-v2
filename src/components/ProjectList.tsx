import Link from 'next/link'

import { pluralDays } from '@/lib/format'
import { segmentLabel } from '@/lib/segments'
import type { Project } from '@/payload-types'

import { CmsImage } from './CmsImage'

export function ProjectList({ projects, headingLevel = 3 }: { projects: Project[]; headingLevel?: 2 | 3 }) {
  if (!projects.length) {
    return (
      <p className="ui text-pencil">
        Ukázky prací tu brzy přibudou. Mezitím se rovnou zeptejte na konzultaci.
      </p>
    )
  }
  const H = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <ul className="divide-y divide-line border-y border-line">
      {projects.map((p, i) => (
        <li key={p.id} className="group relative grid gap-6 py-8 md:grid-cols-[1.35fr_1fr] md:gap-10 md:py-10">
          <div className={`overflow-hidden border border-line bg-surface ${i % 2 ? 'md:order-2' : ''}`}>
            {p.cover && typeof p.cover === 'object' ? (
              <CmsImage
                media={p.cover}
                sizes="(min-width: 1024px) 640px, 100vw"
                className="aspect-[16/10] h-auto w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="hatch aspect-[16/10]" />
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="ui text-[0.95rem] text-pencil">
              {p.client}
              {p.segment ? `, ${segmentLabel(p.segment).toLowerCase()}` : ''}
              {p.isDemo && (
                <span className="ml-2 rounded-[2px] border border-pencil px-1.5 py-0.5 text-[0.8rem]">ukázka</span>
              )}
            </p>
            <H className="mt-2 text-[1.75rem] leading-tight">
              <Link href={`/portfolio/${p.slug}`} className="no-underline after:absolute after:inset-0 hover:underline hover:decoration-accent hover:decoration-2">
                {p.title}
              </Link>
            </H>
            <p className="mt-3 text-pencil">{p.summary}</p>

            {(p.deliveredInDays || p.pagespeedMobile) && (
              <dl className="ui mt-6 flex gap-8">
                {p.deliveredInDays ? (
                  <div>
                    <dt className="text-[0.85rem] text-pencil">Hotovo za</dt>
                    <dd className="text-2xl font-bold tabular-nums">
                      {p.deliveredInDays} {pluralDays(p.deliveredInDays)}
                    </dd>
                  </div>
                ) : null}
                {p.pagespeedMobile ? (
                  <div>
                    <dt className="text-[0.85rem] text-pencil">PageSpeed mobil</dt>
                    <dd className="text-2xl font-bold tabular-nums">{p.pagespeedMobile}/100</dd>
                  </div>
                ) : null}
              </dl>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
