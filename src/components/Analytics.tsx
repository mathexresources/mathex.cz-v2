import Script from 'next/script'

import { env } from '@/lib/env'

/**
 * Analytika bez cookies (Plausible nebo Umami) – nevyžaduje cookie lištu.
 * Zapíná se proměnnými prostředí, viz .env.example.
 */
export function Analytics() {
  const plausible = env.plausibleDomain
  const umamiId = env.umamiWebsiteId
  const umamiSrc = env.umamiSrc

  if (plausible) {
    return (
      <Script
        defer
        data-domain={plausible}
        src={env.plausibleSrc}
        strategy="afterInteractive"
      />
    )
  }
  if (umamiId && umamiSrc) {
    return <Script defer src={umamiSrc} data-website-id={umamiId} strategy="afterInteractive" />
  }
  return null
}
