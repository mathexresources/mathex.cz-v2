import { NextResponse, type NextRequest } from 'next/server'

/**
 * Přesměruje www.domena.cz → domena.cz (301), aby Google neviděl dva weby.
 * Když holá doména odpovídá SITE_URL, použije se její schéma (https),
 * jinak se schéma bere z hlavičky X-Forwarded-Proto od proxy/tunelu.
 */
export function proxy(req: NextRequest) {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(':')[0]
  if (!host.startsWith('www.')) return NextResponse.next()

  const bare = host.slice(4)
  const path = `${req.nextUrl.pathname}${req.nextUrl.search}`
  let origin = `${req.headers.get('x-forwarded-proto') || 'https'}://${bare}`
  try {
    const site = new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '')
    if (site.hostname === bare) origin = site.origin
  } catch {
    // SITE_URL není nastavené – zůstane odhad z hlaviček
  }
  // Hlavička Location ručně – NextResponse.redirect umí adresu „zkrátit“ na relativní,
  // a pak by www přesměrovávalo samo na sebe.
  return new NextResponse(null, { status: 301, headers: { Location: `${origin}${path}` } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/|healthz).*)'],
}
