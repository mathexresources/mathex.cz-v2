import type { Metadata } from 'next'

import type { Media } from '@/payload-types'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const absoluteUrl = (path = '/') => (path.startsWith('http') ? path : `${SITE_URL}${path}`)

type MetaGroup = { title?: string | null; description?: string | null; image?: number | Media | null } | null | undefined

export function mediaUrl(media: number | Media | null | undefined, size?: 'og' | 'card' | 'wide' | 'thumb') {
  if (!media || typeof media !== 'object') return undefined
  const sized = size ? media.sizes?.[size]?.url : undefined
  const url = sized || media.url
  return url ? absoluteUrl(url) : undefined
}

/**
 * Sestaví metadata stránky. Pole z administrace (SEO) mají přednost
 * před automatickými hodnotami.
 */
export function buildMetadata(opts: {
  title: string
  description?: string | null
  path: string
  meta?: MetaGroup
  image?: number | Media | null
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
  noindex?: boolean
  absoluteTitle?: boolean
}): Metadata {
  const title = opts.meta?.title || opts.title
  const description = opts.meta?.description || opts.description || undefined
  const image = mediaUrl(opts.meta?.image, 'og') || mediaUrl(opts.image, 'og')
  const url = absoluteUrl(opts.path)

  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: opts.type ?? 'website',
      url,
      title,
      description,
      locale: 'cs_CZ',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      ...(opts.type === 'article'
        ? {
            publishedTime: opts.publishedTime ?? undefined,
            modifiedTime: opts.modifiedTime ?? undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
