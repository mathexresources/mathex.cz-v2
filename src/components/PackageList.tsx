import Link from 'next/link'

import { formatPrice, pluralDays } from '@/lib/format'
import type { Package } from '@/payload-types'

export function PackageList({ packages }: { packages: Package[] }) {
  if (!packages.length) return null
  return (
    <div className="grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
      {packages.map((p) => (
        <article
          key={p.id}
          className={`relative flex flex-col border-b border-line py-8 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0 ${
            p.highlighted ? 'md:-my-px md:bg-surface md:!px-7 md:outline md:outline-1 md:outline-ink' : ''
          }`}
        >
          {p.highlighted && (
            <p className="ui absolute -top-3 left-0 bg-tape px-2 py-0.5 text-[0.85rem] font-semibold text-on-tape md:left-7">
              Nejčastější volba
            </p>
          )}
          <h3 className="text-[1.5rem]">{p.name}</h3>
          <p className="mt-2 text-[1rem] text-pencil">{p.description}</p>

          <p className="ui mt-6">
            {p.priceFrom && <span className="text-pencil">od </span>}
            <span className="text-[2.25rem] font-bold tracking-[-0.03em] tabular-nums">{formatPrice(p.price)}</span>
          </p>
          <p className="ui mt-1 text-[0.9rem] text-pencil">
            {p.deliveryDays ? `Hotovo do ${p.deliveryDays} ${pluralDays(p.deliveryDays)} od dodání podkladů. ` : ''}
            {p.priceNote}
          </p>

          {p.features?.length ? (
            <ul className="ui mt-6 space-y-2.5 text-[0.975rem]">
              {p.features.map((f) => (
                <li key={f.id ?? f.text} className="flex gap-3">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-1 h-4 w-4 flex-none">
                    <path d="M2 8.5 6 12.5 14 3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto pt-8">
            <Link
              href={`/rezervace?balicek=${encodeURIComponent(p.name)}`}
              className={`btn w-full ${p.highlighted ? 'btn-primary' : 'btn-secondary'}`}
            >
              Probrat {p.name}
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
