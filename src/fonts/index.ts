import localFont from 'next/font/local'

export const displayFont = localFont({
  src: './bricolage-grotesque.woff2',
  weight: '400 800',
  style: 'normal',
  // Nadpisy jsou hlavní obsah (LCP): když písmo nedorazí do ~100 ms, zůstane
  // při první návštěvě upravený záložní font a nadpis se už nepřekresluje.
  display: 'optional',
  variable: '--font-bricolage',
  fallback: ['ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

export const serifFont = localFont({
  src: './source-serif-4.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-source-serif',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
})
