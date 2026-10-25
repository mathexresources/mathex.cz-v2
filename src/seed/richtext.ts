/**
 * Převede jednoduchý text na formát editoru Lexical.
 *   „## Nadpis“  → nadpis H2
 *   „### Nadpis“ → nadpis H3
 *   „- položka“  → odrážka (sousední řádky tvoří jeden seznam)
 *   „1. položka“ → číslovaný seznam
 *   prázdný řádek odděluje odstavce
 */
const text = (t: string) => ({ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })

const base = { format: '', indent: 0, version: 1, direction: 'ltr' as const }

export function rt(source: string) {
  const blocks = source.trim().split(/\n{2,}/)
  const children: unknown[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim())
    if (lines[0].startsWith('### ')) {
      children.push({ ...base, type: 'heading', tag: 'h3', children: [text(lines[0].slice(4))] })
      continue
    }
    if (lines[0].startsWith('## ')) {
      children.push({ ...base, type: 'heading', tag: 'h2', children: [text(lines[0].slice(3))] })
      continue
    }
    if (lines.every((l) => l.startsWith('- ')) || lines.every((l) => /^\d+\. /.test(l))) {
      const ordered = /^\d+\. /.test(lines[0])
      children.push({
        ...base,
        type: 'list',
        listType: ordered ? 'number' : 'bullet',
        tag: ordered ? 'ol' : 'ul',
        start: 1,
        children: lines.map((l, i) => ({
          ...base,
          type: 'listitem',
          value: i + 1,
          children: [text(l.replace(/^(- |\d+\. )/, ''))],
        })),
      })
      continue
    }
    children.push({ ...base, type: 'paragraph', textFormat: 0, textStyle: '', children: [text(lines.join(' '))] })
  }

  return { root: { ...base, type: 'root', children } }
}
