import Script from 'next/script'

/**
 * Analytika bez cookies (Plausible nebo Umami) – nevyžaduje cookie lištu.
 * Zapíná se proměnnými prostředí, viz .env.example.
 */
export function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC

  if (plausible) {
    return (
      <Script
        defer
        data-domain={plausible}
        src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'}
        strategy="afterInteractive"
      />
    )
  }
  if (umamiId && umamiSrc) {
    return <Script defer src={umamiSrc} data-website-id={umamiId} strategy="afterInteractive" />
  }
  return null
}
