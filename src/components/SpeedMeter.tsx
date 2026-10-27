'use client'

import { useEffect, useState } from 'react'

type Metrics = {
  load: number
  lcp: number | null
  bytes: number
  requests: number
}


const seconds = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const kb = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

function measure(lcp: number | null): Metrics | null {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (!nav || !nav.loadEventEnd) return null
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const bytes = [nav, ...resources].reduce((sum, r) => sum + (r.encodedBodySize || r.transferSize || 0), 0)
  return { load: nav.loadEventEnd, lcp, bytes, requests: resources.length + 1 }
}

/**
 * Živé měření rychlosti právě načtené stránky přímo v prohlížeči návštěvníka.
 * Důkaz místo tvrzení: nic se nepředstírá, čísla jsou z Performance API.
 */
export function SpeedMeter({ medallion }: { medallion: React.ReactNode }) {
  const [m, setM] = useState<Metrics | null>(null)

  useEffect(() => {
    let lcp: number | null = null
    let observer: PerformanceObserver | undefined
    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) lcp = last.startTime
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      // Prohlížeč LCP nepodporuje (např. Safari) – řádek se nezobrazí
    }

    const done = () =>
      window.setTimeout(() => {
        observer?.disconnect()
        setM(measure(lcp))
      }, 60)

    if (document.readyState === 'complete') done()
    else window.addEventListener('load', done, { once: true })
    return () => {
      window.removeEventListener('load', done)
      observer?.disconnect()
    }
  }, [])

  const main = m ? (m.lcp ?? m.load) : null

  return (
    <figure className="relative mx-auto w-full max-w-[27rem] [container-type:inline-size]" aria-labelledby="speed-caption">
      <div className="relative aspect-square">
        <div className="absolute inset-0">{medallion}</div>
        <div className="absolute inset-0 grid place-content-center justify-items-center text-center">
          <figcaption id="speed-caption" className="max-w-[34cqi] text-[clamp(0.72rem,3.1cqi,0.875rem)] leading-snug text-pencil">
            Tahle stránka se vám zobrazila za
          </figcaption>
          <p className="my-[1.2cqi] font-display text-[8.6cqi] font-extrabold leading-none" aria-live="polite">
            {main != null ? `${seconds.format(main / 1000)} s` : <span className="text-line">–,– s</span>}
          </p>
          <p className="max-w-[34cqi] text-[clamp(0.72rem,3.1cqi,0.875rem)] leading-snug text-pencil">změřeno teď ve vašem prohlížeči</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-4 border-t border-line pt-4 text-center">
        <Metric label="Celé načtení" value={m ? `${seconds.format(m.load / 1000)} s` : null} />
        <Metric label="Velikost" value={m ? `${kb.format(Math.max(1, m.bytes / 1024))} kB` : null} />
        <Metric label="Souborů" value={m ? String(m.requests) : null} />
      </dl>
      <p className="mt-3 text-center text-[0.85rem] text-pencil">Google považuje za rychlé do 2,5 s.</p>
    </figure>
  )
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[0.8rem] text-pencil">{label}</dt>
      <dd className="mt-0.5 text-[1.125rem] font-bold leading-tight">{value ?? <span className="text-line">–</span>}</dd>
    </div>
  )
}
