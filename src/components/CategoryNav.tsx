import Link from 'next/link'

import type { Category } from '@/payload-types'

export function CategoryNav({ categories, active }: { categories: Category[]; active?: string }) {
  if (!categories.length) return null
  const base =
    'rounded-full border px-3.5 py-1.5 no-underline transition-colors hover:border-ink'
  return (
    <nav aria-label="Kategorie článků" className="ui mt-8">
      <ul className="flex flex-wrap gap-2 text-[0.95rem]">
        <li>
          <Link
            href="/blog"
            aria-current={!active ? 'page' : undefined}
            className={`${base} ${!active ? 'border-ink bg-ink text-paper' : 'border-line'}`}
          >
            Vše
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/blog/kategorie/${c.slug}`}
              aria-current={active === c.slug ? 'page' : undefined}
              className={`${base} ${active === c.slug ? 'border-ink bg-ink text-paper' : 'border-line'}`}
            >
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
