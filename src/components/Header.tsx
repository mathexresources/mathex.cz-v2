import Link from 'next/link'

import { NavLinks } from './NavLinks'
import { Wordmark } from './Wordmark'

export function Header({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-paper">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <Link href="/" className="no-underline" aria-label={`${brand} – úvodní stránka`}>
          <Wordmark name={brand} />
        </Link>

        <nav aria-label="Hlavní navigace" className="hidden lg:block">
          <NavLinks
            className="ui flex items-center gap-7 text-[1rem] font-semibold"
            linkClassName="no-underline text-pencil hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-tape aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-[6px]"
          />
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/rezervace" className="btn btn-primary hidden min-h-10 px-4 py-2 text-[0.95rem] sm:inline-flex">
            Rezervovat konzultaci
          </Link>

          {/* Mobilní menu bez JavaScriptu */}
          <details className="group relative lg:hidden">
            <summary className="ui flex h-10 cursor-pointer list-none items-center gap-2 border-2 border-ink px-3 text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Zavřít</span>
            </summary>
            <nav
              aria-label="Mobilní navigace"
              className="absolute right-0 top-12 w-64 border-2 border-ink bg-paper p-2"
            >
              <NavLinks
                className="ui flex flex-col text-lg"
                linkClassName="block px-3 py-2.5 no-underline hover:bg-paper aria-[current=page]:bg-paper aria-[current=page]:font-semibold"
              />
              <Link href="/rezervace" className="btn btn-primary mt-2 w-full">
                Rezervovat konzultaci
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
