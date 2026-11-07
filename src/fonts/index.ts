import localFont from 'next/font/local'

/** Archivo Expanded Black – velké nadpisy. */
export const displayFont = localFont({
  src: './archivo-expanded.woff2',
  weight: '700 900',
  style: 'normal',
  // Nadpisy jsou hlavní obsah (LCP): když písmo nedorazí do ~100 ms, zůstane
  // při první návštěvě upravený záložní font a nadpis se už nepřekresluje.
  display: 'optional',
  variable: '--font-archivo-expanded',
  fallback: ['Arial Black', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

/** Archivo v běžné šířce – text a ovládací prvky. */
export const textFont = localFont({
  src: './archivo-text.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-archivo',
  fallback: ['ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})
