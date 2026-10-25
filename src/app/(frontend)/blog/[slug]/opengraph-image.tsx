import { getPostBySlug, getSiteSettings } from '@/lib/data'
import { OG_SIZE, renderOg } from '@/lib/og'

export const dynamic = 'force-dynamic'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Článek z blogu'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [site, post] = await Promise.all([getSiteSettings(), getPostBySlug(slug)])
  return renderOg({ title: post?.title ?? 'Blog', label: 'Blog', brand: site.brandName })
}
