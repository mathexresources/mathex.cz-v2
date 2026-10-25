'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/sluzby', label: 'Služby' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/cenik', label: 'Ceník' },
  { href: '/blog', label: 'Blog' },
  { href: '/o-mne', label: 'O mně' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function NavLinks({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={linkClassName}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
