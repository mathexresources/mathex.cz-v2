import localFont from 'next/font/local'

/** Archivo Expanded Black – velké nadpisy. */
export const displayFont = localFont({
  src: './archivo-expanded.woff2',
  weight: '700 900',
  style: 'normal',
  // swap: nadpis se vždy dokreslí širokým písmem (soubor má jen ~25 kB a je v preloadu).
  // Záložní písmo se záměrně neupravuje na šířku Archiva – roztažený Arial by byl
  // o třetinu vyšší a řádky obřího nadpisu by se překrývaly.
  display: 'swap',
  variable: '--font-archivo-expanded',
  fallback: ['Arial Black', 'Arial', 'sans-serif'],
  adjustFontFallback: false,
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
