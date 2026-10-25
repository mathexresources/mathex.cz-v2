import type { MetadataRoute } from 'next'

import { getSitemapEntries } from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, services, projects, pages, categories } = await getSitemapEntries()
  const latest = (items: { updatedAt?: string | null }[]) =>
    items.reduce<string | undefined>((max, i) => (i.updatedAt && (!max || i.updatedAt > max) ? i.updatedAt : max), undefined)

  const fixed: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/sluzby'), changeFrequency: 'monthly', priority: 0.9, lastModified: latest(services) },
    { url: absoluteUrl('/portfolio'), changeFrequency: 'monthly', priority: 0.8, lastModified: latest(projects) },
    { url: absoluteUrl('/cenik'), changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/rezervace'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/kontakt'), changeFrequency: 'yearly', priority: 0.7 },
    { url: absoluteUrl('/o-mne'), changeFrequency: 'yearly', priority: 0.6 },
    { url: absoluteUrl('/faq'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/blog'), changeFrequency: 'weekly', priority: 0.7, lastModified: latest(posts) },
  ]

  return [
    ...fixed,
    ...services.map((s) => ({ url: absoluteUrl(`/sluzby/${s.slug}`), lastModified: s.updatedAt, priority: 0.9 })),
    ...projects.map((p) => ({ url: absoluteUrl(`/portfolio/${p.slug}`), lastModified: p.updatedAt, priority: 0.6 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/blog/kategorie/${c.slug}`), lastModified: c.updatedAt, priority: 0.4 })),
    ...pages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.2 })),
  ]
}
