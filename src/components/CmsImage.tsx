import Image from 'next/image'

import type { Media } from '@/payload-types'

type Props = {
  media: number | Media | null | undefined
  sizes: string
  className?: string
  priority?: boolean
  alt?: string
}

/** Obrázek z administrace – optimalizovaný přes next/image (AVIF/WebP, srcset, lazy loading). */
export function CmsImage({ media, sizes, className, priority, alt }: Props) {
  if (!media || typeof media !== 'object' || !media.url) return null
  return (
    <Image
      src={media.url}
      alt={alt ?? media.alt ?? ''}
      width={media.width ?? 1600}
      height={media.height ?? 1000}
      sizes={sizes}
      className={className}
      priority={priority}
      style={
        media.focalX != null && media.focalY != null
          ? { objectPosition: `${media.focalX}% ${media.focalY}%` }
          : undefined
      }
    />
  )
}
