import Link from 'next/link'

import type { Page, Service, SiteSetting } from '@/payload-types'

import { Wordmark } from './Wordmark'

type Props = {
  site: SiteSetting
  services: Pick<Service, 'title' | 'slug'>[]
  pages: Pick<Page, 'title' | 'slug' | 'showInFooter'>[]
}

export function Footer({ site, services, pages }: Props) {
  const year = new Date().getFullYear()
  const address = [site.street, [site.zip, site.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <footer className="mt-24 border-t border-line pb-24 pt-14 sm:pb-12">
      <div className="container-site grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark name={site.brandName} />
          <p className="mt-4 text-[1rem] text-pencil">{site.tagline}</p>
          <p className="ui mt-6 text-[0.95rem]">
            <a href={`mailto:${site.email}`} className="block">
              {site.email}
            </a>
            {site.phone && (
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="mt-1 block">
                {site.phone}
              </a>
            )}
          </p>
        </div>

        <FooterList title="Služby">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={`/sluzby/${s.slug}`}>{s.title}</Link>
            </li>
          ))}
          <li>
            <Link href="/cenik">Ceník</Link>
          </li>
        </FooterList>

        <FooterList title="Web">
          <li><Link href="/portfolio">Portfolio</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li><Link href="/faq">Časté otázky</Link></li>
          <li><Link href="/o-mne">O mně</Link></li>
          <li><Link href="/rezervace">Rezervace</Link></li>
        </FooterList>

        <FooterList title="Profily">
          {(site.socials ?? []).map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noopener me" target="_blank">
                {s.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/blog/rss.xml">RSS blogu</a>
          </li>
        </FooterList>
      </div>

      <div className="container-site mt-14 flex flex-col gap-4 border-t border-line pt-6 text-[0.875rem] text-pencil md:flex-row md:justify-between">
        <div>
          <p>
            © {year} {site.ownerName}, IČO {site.ico}, {site.vatPayer && site.dic ? `DIČ ${site.dic}` : 'neplátce DPH'}
          </p>
          {address && <p>{address}</p>}
          <p>{site.registry}</p>
        </div>
        <ul className="ui flex flex-wrap gap-x-5 gap-y-1">
          {pages
            .filter((p) => p.showInFooter !== false)
            .map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
        </ul>
      </div>
    </footer>
  )
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[0.95rem] font-bold tracking-normal text-ink">{title}</h2>
      <ul className="ui mt-3 space-y-2 text-[0.95rem] text-pencil [&_a]:no-underline [&_a:hover]:text-ink [&_a:hover]:underline">
        {children}
      </ul>
    </div>
  )
}
