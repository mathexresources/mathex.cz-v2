import { getHomePage, getSiteSettings } from '@/lib/data'
import { plainText } from '@/components/AccentText'
import { OG_SIZE, renderOg } from '@/lib/og'

export const dynamic = 'force-dynamic'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Weby na míru a přednášky o bezpečnosti na internetu'

export default async function Image() {
  const [site, home] = await Promise.all([getSiteSettings(), getHomePage()])
  return renderOg({ title: plainText(home.heroTitle), brand: site.brandName })
}
