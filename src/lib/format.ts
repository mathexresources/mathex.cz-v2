const czk = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

export const formatPrice = (n: number) => `${czk.format(n)} Kč`

export const pluralDays = (n: number) => (n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní')

/** Přibližná doba čtení (200 slov za minutu) z Lexical JSON. */
export function readingMinutes(richText: unknown): number {
  let words = 0
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: string; children?: unknown[]; root?: unknown }
    if (typeof n.text === 'string') words += n.text.split(/\s+/).filter(Boolean).length
    if (n.root) walk(n.root)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  walk(richText)
  return Math.max(1, Math.round(words / 200))
}

export const pluralMinutes = (n: number) => (n === 1 ? 'minuta' : n >= 2 && n <= 4 ? 'minuty' : 'minut')
