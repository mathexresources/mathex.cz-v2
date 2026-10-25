import 'server-only'

import type { Interval } from './slots'

/**
 * Načte obsazené termíny z tajné iCal adresy (např. Google Kalendář),
 * aby se v rezervacích nenabízely časy, kdy už máš něco jiného.
 * Výsledek se drží 5 minut v paměti.
 */
let cache: { at: number; data: Interval[] } | null = null
const TTL = 5 * 60 * 1000

export async function getBusyIntervals(rangeStart: Date, rangeEnd: Date): Promise<Interval[]> {
  const url = process.env.BUSY_CALENDAR_ICS_URL
  if (!url) return []
  if (cache && Date.now() - cache.at < TTL) return cache.data

  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    const ical = (await import('node-ical')).default
    const parsed = ical.sync.parseICS(text)
    const out: Interval[] = []

    for (const item of Object.values(parsed)) {
      if (!item || item.type !== 'VEVENT') continue
      const ev = item as unknown as {
        start: Date
        end?: Date
        transparency?: string
        status?: string
        datetype?: string
        rrule?: { between: (a: Date, b: Date, inc: boolean) => Date[] }
        exdate?: Record<string, Date>
      }
      if (ev.transparency === 'TRANSPARENT' || ev.status === 'CANCELLED') continue
      const start = new Date(ev.start)
      let end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 60 * 60000)
      // Celodenní událost bez konce zablokuje celý den
      if (ev.datetype === 'date' && !ev.end) end = new Date(start.getTime() + 24 * 3600000)
      const duration = end.getTime() - start.getTime()

      if (ev.rrule) {
        const excluded = new Set(Object.values(ev.exdate ?? {}).map((d) => new Date(d).getTime()))
        for (const occ of ev.rrule.between(new Date(rangeStart.getTime() - duration), rangeEnd, true)) {
          if (excluded.has(occ.getTime())) continue
          out.push({ start: occ, end: new Date(occ.getTime() + duration) })
        }
      } else if (end > rangeStart && start < rangeEnd) {
        out.push({ start, end })
      }
    }

    cache = { at: Date.now(), data: out }
    return out
  } catch (err) {
    console.error('[rezervace] Nepodařilo se načíst kalendář obsazenosti:', err)
    return cache?.data ?? []
  }
}
