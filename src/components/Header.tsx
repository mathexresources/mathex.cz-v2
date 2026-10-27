import Link from 'next/link'

import { NavLinks } from './NavLinks'
import { Wordmark } from './Wordmark'

export function Header({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <Link href="/" className="no-underline" aria-label={`${brand} – úvodní stránka`}>
          <Wordmark name={brand} />
        </Link>

        <nav aria-label="Hlavní navigace" className="hidden lg:block">
          <NavLinks
            className="ui flex items-center gap-7 text-[0.975rem]"
            linkClassName="no-underline text-pencil hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-tape aria-[current=page]:decoration-2"
          />
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/rezervace" className="btn btn-primary hidden min-h-10 px-4 py-2 text-[0.95rem] sm:inline-flex">
            Rezervovat konzultaci
          </Link>

          {/* Mobilní menu bez JavaScriptu */}
          <details className="group relative lg:hidden">
            <summary className="ui flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-line px-3 text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Zavřít</span>
            </summary>
            <nav
              aria-label="Mobilní navigace"
              className="absolute right-0 top-12 w-64 border border-line bg-surface p-2 shadow-[0_12px_32px_-12px_rgb(23_36_64/0.35)]"
            >
              <NavLinks
                className="ui flex flex-col text-lg"
                linkClassName="block rounded px-3 py-2.5 no-underline hover:bg-paper aria-[current=page]:bg-paper aria-[current=page]:font-semibold"
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
