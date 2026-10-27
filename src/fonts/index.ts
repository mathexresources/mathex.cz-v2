import localFont from 'next/font/local'

/** Archivo Expanded – nadpisy (široký řez jako na dokladech a bankovkách). */
export const displayFont = localFont({
  src: './archivo-expanded.woff2',
  weight: '600 800',
  style: 'normal',
  // Nadpisy jsou hlavní obsah (LCP): když písmo nedorazí do ~100 ms, zůstane
  // při první návštěvě upravený záložní font a nadpis se už nepřekresluje.
  display: 'optional',
  variable: '--font-archivo',
  fallback: ['Arial Black', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

/** Atkinson Hyperlegible Next – text a ovládací prvky (navrženo pro maximální čitelnost). */
export const textFont = localFont({
  src: './atkinson-hyperlegible-next.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-atkinson',
  fallback: ['ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
})
