import { readFile } from 'fs/promises'
import path from 'path'

import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

const FONT_PATH = path.join(process.cwd(), 'assets/og-bold.ttf')

async function loadFonts() {
  try {
    const file = await readFile(FONT_PATH)
    return [{ name: 'Archivo', data: new Uint8Array(file).buffer as ArrayBuffer, weight: 700 as const, style: 'normal' as const }]
  } catch {
    return []
  }
}

/** Automaticky generovaný obrázek pro sdílení na sociálních sítích. */
export async function renderOg({ title, label, brand }: { title: string; label?: string; brand: string }) {
  const fonts = await loadFonts()
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#10302B',
          color: '#ECEEE6',
          fontFamily: 'Archivo',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 34 }}>
          <svg width="40" height="40" viewBox="0 0 24 24">
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                cx={12 + 4.6 * Math.cos((i / 8) * Math.PI * 2)}
                cy={12 + 4.6 * Math.sin((i / 8) * Math.PI * 2)}
                r="5.6"
                fill="none"
                stroke="#B496F0"
                strokeWidth="1.1"
              />
            ))}
          </svg>
          {brand}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {label && <div style={{ fontSize: 30, color: '#B496F0' }}>{label}</div>}
          <div
            style={{
              fontSize: title.length > 60 ? 48 : 60,
              lineHeight: 1.08,
              letterSpacing: '-0.01em',
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', height: 6, width: '100%', backgroundImage: 'linear-gradient(to right, #4DB8AC, #B496F0)' }} />
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  )
}
