/**
 * Gilošování – jemné propletené vlnovky z ochranného tisku bankovek a dokladů.
 * Křivky se počítají jednou (na serveru) a kopie se kreslí přes <use> s otočením
 * a zvětšením, takže SVG zůstane malé (jednotky kB).
 */

const TAU = Math.PI * 2
const r1 = (n: number) => Math.round(n * 10) / 10

/** Uzavřená křivka kolem středu c s poloměrem r(t). */
function polar(c: number, radius: (t: number) => number, steps: number) {
  let d = ''
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * TAU
    const r = radius(t)
    d += `${i ? 'L' : 'M'}${r1(c + r * Math.cos(t))} ${r1(c + r * Math.sin(t))}`
  }
  return `${d}Z`
}

const SIZE = 440
const C = SIZE / 2
const BAND_R = 160
const ROSE_R = 112

// Dvě protiběžné vlnové pásky (moaré) a vnitřní rozeta z lístků
const WAVE = polar(C, (t) => BAND_R + 9 * Math.sin(30 * t), 30 * 12)
const ROSE = polar(C, (t) => ROSE_R + 14 * Math.abs(Math.sin(12 * t)), 12 * 2 * 14)
const deg = (rad: number) => r1((rad * 180) / Math.PI * 100) / 100

type Copy = { href: string; rotate: number; scale: number }

const COPIES: Copy[] = [
  ...Array.from({ length: 22 }, (_, k) => ({ href: 'w', rotate: -deg((k * 0.22) / 30), scale: (BAND_R + k * 1.8) / BAND_R })),
  ...Array.from({ length: 22 }, (_, k) => ({ href: 'w', rotate: 6 + deg((k * 0.22) / 30), scale: (BAND_R + k * 1.8) / BAND_R })),
  ...Array.from({ length: 14 }, (_, k) => ({ href: 'r', rotate: -deg((k * 0.05) / 12), scale: (ROSE_R + k * 1.7) / ROSE_R })),
]

const MICROTEXT = 'ručně napsaný kód bez šablon a stavebnic  '

/** Medailon – jako ochranný prvek na bankovce. Obsah (číslo) se klade doprostřed zvenku. */
export function GuillocheMedallion({ id, className }: { id: string; className?: string }) {
  const ring = 101
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-iris`} x1="0" y1="0" x2={SIZE} y2={SIZE} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-iris-a)" />
          <stop offset="1" stopColor="var(--color-iris-b)" />
        </linearGradient>
        <path id={`${id}-w`} d={WAVE} />
        <path id={`${id}-r`} d={ROSE} />
        <path id={`${id}-ring`} d={`M${C - ring} ${C}a${ring} ${ring} 0 1 1 ${ring * 2} 0a${ring} ${ring} 0 1 1 -${ring * 2} 0`} />
      </defs>
      <g fill="none" stroke={`url(#${id}-iris)`} strokeWidth="0.6">
        {COPIES.map((c, i) => (
          <use
            key={i}
            href={`#${id}-${c.href}`}
            vectorEffect="non-scaling-stroke"
            transform={`translate(${C} ${C}) rotate(${r1(c.rotate * 100) / 100}) scale(${c.scale.toFixed(4)}) translate(-${C} -${C})`}
          />
        ))}
      </g>
      {/* Mikrotext – na bankovkách čitelný jen lupou */}
      <text fontSize="5.4" letterSpacing="0.35" fill="var(--color-pencil)" style={{ fontFamily: 'var(--font-text)' }}>
        <textPath href={`#${id}-ring`}>{MICROTEXT.repeat(10)}</textPath>
      </text>
    </svg>
  )
}

/** Ochranný proužek – vodorovná páska vlnovek, opakuje se do libovolné šířky. */
const TILE_W = 48
const TILE_H = 18
function waveRow(phase: number, offset: number, amp: number) {
  let d = ''
  const steps = 16
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * TILE_W
    const y = TILE_H / 2 + offset + amp * Math.sin((x / TILE_W) * TAU + phase)
    d += `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`
  }
  return d
}
const BAND_PATHS = [
  ...Array.from({ length: 6 }, (_, k) => waveRow(k * 0.3, (k - 2.5) * 1.1, 4.5)),
  ...Array.from({ length: 6 }, (_, k) => waveRow(Math.PI - k * 0.3, (k - 2.5) * 1.1, 4.5)),
].join('')

export function GuillocheBand({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} height={TILE_H} width="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-iris`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-iris-a)" />
          <stop offset="1" stopColor="var(--color-iris-b)" />
        </linearGradient>
        <pattern id={`${id}-p`} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
          <path d={BAND_PATHS} fill="none" stroke="#fff" strokeWidth="0.5" />
        </pattern>
        <mask id={`${id}-m`}>
          <rect width="100%" height={TILE_H} fill={`url(#${id}-p)`} />
        </mask>
      </defs>
      {/* vzor jako maska, přes něj duhový přechod po celé šířce */}
      <rect width="100%" height={TILE_H} fill={`url(#${id}-iris)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

/** Malá rozeta pro logo a ikonu. */
export function Rosette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={r1(12 + 4.6 * Math.cos((i / 8) * TAU))} cy={r1(12 + 4.6 * Math.sin((i / 8) * TAU))} r="5.6" />
        ))}
      </g>
    </svg>
  )
}
