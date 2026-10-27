import './globals.css'

import type { Metadata, Viewport } from 'next'

import { Analytics } from '@/components/Analytics'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { MobileCta } from '@/components/MobileCta'
import { displayFont, textFont } from '@/fonts'
import { getPages, getServices, getSiteSettings, getTestimonials } from '@/lib/data'
import { businessSchema, personSchema, websiteSchema } from '@/lib/schema'
import { SITE_URL } from '@/lib/seo'

// Stránky se renderují na serveru z cache (viz lib/data.ts) – build nepotřebuje databázi.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  const description =
    site.defaultDescription ||
    'Rychlé a bezpečné weby na míru a přednášky o bezpečnosti na internetu pro školy, firmy i veřejnost.'
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${site.brandName} – ${site.tagline}`,
      template: `%s | ${site.brandName}`,
    },
    description,
    applicationName: site.brandName,
    authors: [{ name: site.ownerName, url: `${SITE_URL}/o-mne` }],
    creator: site.ownerName,
    formatDetection: { telephone: false, address: false, email: false },
    alternates: {
      canonical: SITE_URL,
      types: { 'application/rss+xml': `${SITE_URL}/blog/rss.xml` },
    },
    openGraph: {
      siteName: site.brandName,
      locale: 'cs_CZ',
      type: 'website',
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eceee6' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1a18' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [site, services, pages, testimonials] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getPages(),
    getTestimonials(20),
  ])

  return (
    <html lang="cs" className={`${displayFont.variable} ${textFont.variable}`}>
      <body>
        <a
          href="#obsah"
          className="ui sr-only z-50 bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Přeskočit na obsah
        </a>
        <Header brand={site.brandName} />
        <main id="obsah">{children}</main>
        <Footer site={site} services={services} pages={pages} />
        <MobileCta phone={site.phone} />
        <JsonLd data={[businessSchema(site, testimonials), websiteSchema(site), personSchema(site)]} />
        <Analytics />
      </body>
    </html>
  )
}
