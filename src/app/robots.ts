import type { MetadataRoute } from 'next'

import { absoluteUrl, SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  // Testovací instance (jiná adresa než produkční) se neindexuje
  const isProduction = process.env.NODE_ENV === 'production' && !/localhost|staging|test/.test(SITE_URL)
  return {
    rules: isProduction
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/rezervace/zrusit', '/kalendar.ics'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  }
}
