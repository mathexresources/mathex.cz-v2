'use client'

import { useEffect, useState } from 'react'

type Metrics = {
  load: number
  lcp: number | null
  bytes: number
  requests: number
}

const SCALE_MAX = 4000 // ms – konec měřítka
const GOOD_LCP = 2500 // ms – hranice „dobré“ podle Core Web Vitals

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
export function SpeedMeter() {
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

  const markerMs = m ? (m.lcp ?? m.load) : null
  const markerPos = markerMs != null ? Math.min(100, (markerMs / SCALE_MAX) * 100) : null
  const goodPos = (GOOD_LCP / SCALE_MAX) * 100

  return (
    <figure
      className="ui relative border border-ink bg-surface p-5 sm:p-6"
      aria-labelledby="speed-caption"
    >
      <figcaption id="speed-caption" className="text-[0.95rem] text-pencil">
        Tahle stránka, změřeno teď ve vašem prohlížeči
      </figcaption>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4" aria-live="polite">
        <Metric
          label="Načtení stránky"
          value={m ? `${seconds.format(m.load / 1000)} s` : null}
        />
        <Metric
          label="Hlavní obsah vidět za"
          value={m?.lcp != null ? `${seconds.format(m.lcp / 1000)} s` : m ? 'neměřitelné' : null}
        />
        <Metric label="Velikost" value={m ? `${kb.format(Math.max(1, m.bytes / 1024))} kB` : null} />
        <Metric label="Počet souborů" value={m ? String(m.requests) : null} />
      </dl>

      {/* Kótovací čára: kde je tahle stránka vůči hranici, kterou Google považuje za dobrou */}
      <div className="mt-6" aria-hidden="true">
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-4 h-px bg-ink" />
          <div className="absolute left-0 top-2 h-4 w-px bg-ink" />
          <div className="absolute right-0 top-2 h-4 w-px bg-ink" />
          <div className="absolute top-1 h-6 w-px bg-pencil" style={{ left: `${goodPos}%` }} />
          {markerPos != null && (
            <div
              className="absolute top-0 h-8 w-2 -translate-x-1/2 bg-tape transition-[left] duration-700 ease-out"
              style={{ left: `${markerPos}%` }}
            />
          )}
        </div>
        <div className="relative mt-1 h-5 text-[0.8rem] text-pencil">
          <span className="absolute left-0">0 s</span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${goodPos}%` }}>
            limit Googlu 2,5 s
          </span>
          <span className="absolute right-0">4 s</span>
        </div>
      </div>
    </figure>
  )
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[0.85rem] text-pencil">{label}</dt>
      <dd className="mt-0.5 text-[1.75rem] font-bold leading-none tracking-[-0.03em] tabular-nums">
        {value ?? <span className="text-line">měřím…</span>}
      </dd>
    </div>
  )
}
