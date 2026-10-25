import { caldavConfigured, fetchCaldavEvents } from './caldav'
import type { Interval } from './slots'

/**
 * Obsazené časy z tvých kalendářů, aby se v rezervacích nenabízely:
 *  – kalendář v iPhonu přes CalDAV (iCloud),
 *  – kalendáře podle adresy iCal/webcal (z administrace nebo BUSY_CALENDAR_ICS_URL).
 * Každý zdroj se drží 2 minuty v paměti; při výpadku se použije poslední známý stav,
 * aby rezervace kvůli kalendáři nespadly.
 */
const TTL = 2 * 60 * 1000
const cache = new Map<string, { at: number; data: Interval[] }>()

export function resetBusyCache() {
  cache.clear()
}

type IcalEvent = {
  type?: string
  start: Date
  end?: Date
  transparency?: string
  status?: string
  datetype?: string
  rrule?: { between: (a: Date, b: Date, inc: boolean) => Date[] }
  exdate?: Record<string, Date>
  recurrences?: Record<string, IcalEvent>
}

type Ical = typeof import('node-ical').default

export function parseBusy(text: string, ical: Ical, rangeStart: Date, rangeEnd: Date) {
  const parsed = ical.sync.parseICS(text)
  const out: Interval[] = []
  for (const item of Object.values(parsed)) {
    if (!item || item.type !== 'VEVENT') continue
    const ev = item as unknown as IcalEvent
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
  return out
}

/** webcal:// je jen jiný zápis https:// (iPhone, iCloud sdílené kalendáře) */
export const normalizeIcsUrl = (url: string) => url.trim().replace(/^webcal:\/\//i, 'https://')

async function fetchIcs(url: string): Promise<string> {
  const res = await fetch(normalizeIcsUrl(url), { cache: 'no-store', signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Odpověď není kalendář ve formátu iCal')
  return text
}

export type BusySources = {
  /** Adresy iCal/webcal (z administrace); BUSY_CALENDAR_ICS_URL se přidá vždy. */
  icsUrls?: string[]
  /** Názvy kalendářů v iCloudu; null = všechny; undefined = CalDAV nepoužívat. */
  caldavCalendars?: string[] | null
}

export type SourceReport = { source: string; ok: boolean; count: number; error?: string; calendars?: string[] }

async function loadSource(
  key: string,
  loader: () => Promise<Interval[]>,
  throwOnError: boolean,
): Promise<{ data: Interval[]; error?: string }> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return { data: hit.data }
  try {
    const data = await loader()
    cache.set(key, { at: Date.now(), data })
    return { data }
  } catch (err) {
    if (throwOnError) throw err
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[rezervace] Kalendář ${key} se nepodařilo načíst:`, message)
    return { data: hit?.data ?? [], error: message }
  }
}

/** Všechny obsazené intervaly z nastavených kalendářů. */
export async function getBusyIntervals(
  rangeStart: Date,
  rangeEnd: Date,
  opts: { throwOnError?: boolean; sources?: BusySources; report?: SourceReport[] } = {},
): Promise<Interval[]> {
  const throwOnError = Boolean(opts.throwOnError)
  const urls = [...(opts.sources?.icsUrls ?? [])]
  if (process.env.BUSY_CALENDAR_ICS_URL) urls.push(process.env.BUSY_CALENDAR_ICS_URL)
  const ical = urls.length || opts.sources?.caldavCalendars !== undefined ? (await import('node-ical')).default : null

  const jobs: Promise<Interval[]>[] = []

  for (const url of [...new Set(urls.map(normalizeIcsUrl))]) {
    jobs.push(
      loadSource(`ics:${url}`, async () => parseBusy(await fetchIcs(url), ical!, rangeStart, rangeEnd), throwOnError).then(
        (r) => {
          opts.report?.push({ source: url, ok: !r.error, count: r.data.length, error: r.error })
          return r.data
        },
      ),
    )
  }

  if (opts.sources?.caldavCalendars !== undefined && caldavConfigured()) {
    const names = opts.sources.caldavCalendars
    let calendars: string[] = []
    jobs.push(
      loadSource(
        `caldav:${names?.join('|') ?? '*'}`,
        async () => {
          const res = await fetchCaldavEvents(rangeStart, rangeEnd, names)
          calendars = res.calendars
          return res.ics.flatMap((text) => parseBusy(text, ical!, rangeStart, rangeEnd))
        },
        throwOnError,
      ).then((r) => {
        opts.report?.push({ source: 'caldav', ok: !r.error, count: r.data.length, error: r.error, calendars })
        return r.data
      }),
    )
  }

  return (await Promise.all(jobs)).flat()
}
