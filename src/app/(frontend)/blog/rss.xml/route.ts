import { getPosts, getSiteSettings } from '@/lib/data'
import { absoluteUrl, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  const [site, posts] = await Promise.all([getSiteSettings(), getPosts({ limit: 30 })])
  const items = posts.docs
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`)
      return `<item>
  <title>${esc(p.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <description>${esc(p.excerpt)}</description>
  ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}
</item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(`${site.brandName} – blog`)}</title>
  <link>${SITE_URL}/blog</link>
  <description>${esc(site.tagline ?? '')}</description>
  <language>cs</language>
  <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
