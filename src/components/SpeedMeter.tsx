'use client'

import { useEffect, useState } from 'react'

type Metrics = {
  load: number
  lcp: number | null
  bytes: number
  requests: number
}

const seconds = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

  const main = m ? (m.lcp ?? m.load) : null

  return (
    <p className="ui mt-6 text-[1rem] text-pencil" aria-live="polite">
      Tahle stránka se vám načetla za{' '}
      <strong className="whitespace-nowrap font-display text-[1.375rem] font-black text-tape">
        {main != null ? `${seconds.format(main / 1000)} s` : '–,– s'}
      </strong>
      . Změřeno teď ve vašem prohlížeči, Google považuje za rychlé do 2,5&nbsp;s.
    </p>
  )
}
