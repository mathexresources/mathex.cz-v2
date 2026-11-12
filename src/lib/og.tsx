import { readFile } from 'fs/promises'
import path from 'path'

import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

const FONT_PATH = path.join(process.cwd(), 'assets/og-bold.ttf')

async function loadFonts() {
  try {
    const file = await readFile(FONT_PATH)
    return [{ name: 'Archivo', data: new Uint8Array(file).buffer as ArrayBuffer, weight: 900 as const, style: 'normal' as const }]
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
          background: '#FFFFFF',
          color: '#000000',
          fontFamily: 'Archivo',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 34 }}>
          <div style={{ width: 14, height: 34, background: '#FF3D00' }} />
          {brand}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {label && <div style={{ fontSize: 30, color: '#FF3D00' }}>{label}</div>}
          <div
            style={{
              fontSize: title.length > 60 ? 50 : 64,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', height: 10, width: 240, background: '#FF3D00' }} />
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  )
}
