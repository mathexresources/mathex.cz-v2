/**
 * Nastavení čtené až za běhu (ne při buildu), takže jeden Docker obraz
 * funguje pro jakoukoli doménu – vše se nastaví v .env na serveru.
 * Proměnné NEXT_PUBLIC_* by Next.js „zapekl“ do obrazu při buildu, proto je
 * nepoužíváme (starší názvy fungují jako záloha).
 */
const read = (name: string) => {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : undefined
}

export const env = {
  get siteUrl() {
    return (read('SITE_URL') || read('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000').replace(/\/$/, '')
  },
  get turnstileSiteKey() {
    return read('TURNSTILE_SITE_KEY') || read('NEXT_PUBLIC_TURNSTILE_SITE_KEY')
  },
  get plausibleDomain() {
    return read('PLAUSIBLE_DOMAIN') || read('NEXT_PUBLIC_PLAUSIBLE_DOMAIN')
  },
  get plausibleSrc() {
    return read('PLAUSIBLE_SRC') || read('NEXT_PUBLIC_PLAUSIBLE_SRC') || 'https://plausible.io/js/script.js'
  },
  get umamiWebsiteId() {
    return read('UMAMI_WEBSITE_ID') || read('NEXT_PUBLIC_UMAMI_WEBSITE_ID')
  },
  get umamiSrc() {
    return read('UMAMI_SRC') || read('NEXT_PUBLIC_UMAMI_SRC')
  },
}
