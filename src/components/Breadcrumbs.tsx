import Link from 'next/link'

import { breadcrumbSchema } from '@/lib/schema'

import { JsonLd } from './JsonLd'

export type Crumb = { name: string; path: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: 'Úvod', path: '/' }, ...items]
  return (
    <>
      <nav aria-label="Drobečková navigace" className="ui text-[0.9rem] text-pencil">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((item, i) => {
            const last = i === all.length - 1
            return (
              <li key={item.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-ink">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="no-underline hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(all)} />
    </>
  )
}
