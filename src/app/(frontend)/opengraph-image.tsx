import { getHomePage, getSiteSettings } from '@/lib/data'
import { OG_SIZE, renderOg } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Weby na míru pro řemeslníky, restaurace a malé firmy'

export default async function Image() {
  const [site, home] = await Promise.all([getSiteSettings(), getHomePage()])
  return renderOg({ title: home.heroTitle, brand: site.brandName })
}
