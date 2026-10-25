import type { MetadataRoute } from 'next'

import { absoluteUrl, SITE_URL } from '@/lib/seo'

// Počítá se za běhu, aby odpovídal doméně nastavené v .env
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  // Lokální a testovací instance (localhost, IP adresa, *.local, staging./test./dev.) se neindexují
  const host = new URL(SITE_URL).hostname
  const isTestHost =
    host === 'localhost' || /^[\d.]+$/.test(host) || host.endsWith('.local') || /^(staging|test|dev)\./.test(host)
  const isProduction = process.env.NODE_ENV === 'production' && !isTestHost
  return {
    rules: isProduction
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/rezervace/zrusit', '/kalendar.ics', '/healthz'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  }
}
