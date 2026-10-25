import { createDAVClient, type DAVCalendar } from 'tsdav'

/**
 * Napojení na kalendář přes CalDAV – typicky iCloud (kalendář v iPhonu),
 * funguje ale i s Nextcloudem, Fastmailem apod.
 *
 * .env:
 *   CALDAV_USERNAME     Apple ID (e-mail)
 *   CALDAV_PASSWORD     heslo pro aplikace z appleid.apple.com (ne heslo k Apple ID!)
 *   CALDAV_URL          výchozí https://caldav.icloud.com
 * (Fungují i názvy ICLOUD_USERNAME a ICLOUD_APP_PASSWORD.)
 */

type Client = Awaited<ReturnType<typeof createDAVClient>>

export type CaldavCalendar = { name: string; url: string }

function config() {
  const username = process.env.CALDAV_USERNAME || process.env.ICLOUD_USERNAME
  const password = process.env.CALDAV_PASSWORD || process.env.ICLOUD_APP_PASSWORD
  if (!username || !password) return null
  return { serverUrl: process.env.CALDAV_URL || 'https://caldav.icloud.com', username, password }
}

export const caldavConfigured = () => config() !== null

let clientPromise: Promise<Client> | null = null
let calendarsCache: { at: number; data: DAVCalendar[] } | null = null
const CALENDARS_TTL = 10 * 60 * 1000

function getClient(): Promise<Client> {
  const cfg = config()
  if (!cfg) return Promise.reject(new Error('CalDAV není nastavený'))
  if (!clientPromise) {
    clientPromise = createDAVClient({
      serverUrl: cfg.serverUrl,
      credentials: { username: cfg.username, password: cfg.password },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    }).catch((err) => {
      clientPromise = null
      throw humanize(err)
    })
  }
  return clientPromise
}

function humanize(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (/401|unauthori[sz]ed|invalid credentials/i.test(msg)) {
    return new Error('Přihlášení odmítnuto – zkontroluj Apple ID a heslo pro aplikace.')
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(msg)) {
    return new Error(`Server kalendáře není dostupný (${msg}).`)
  }
  return err instanceof Error ? err : new Error(msg)
}

const isEventCalendar = (c: DAVCalendar) =>
  !c.components || c.components.length === 0 || c.components.includes('VEVENT')

const displayName = (c: DAVCalendar) =>
  (typeof c.displayName === 'string' ? c.displayName : '') || decodeURIComponent(c.url.split('/').filter(Boolean).pop() || '')

async function fetchCalendarsCached(force = false): Promise<DAVCalendar[]> {
  if (!force && calendarsCache && Date.now() - calendarsCache.at < CALENDARS_TTL) return calendarsCache.data
  const client = await getClient()
  try {
    const data = (await client.fetchCalendars()).filter(isEventCalendar)
    calendarsCache = { at: Date.now(), data }
    return data
  } catch (err) {
    clientPromise = null
    throw humanize(err)
  }
}

export async function listCalendars(force = false): Promise<CaldavCalendar[]> {
  const cals = await fetchCalendarsCached(force)
  return cals.map((c) => ({ name: displayName(c), url: c.url }))
}

/** Rozdělí „Domov, Práce“ na názvy; prázdné = null (všechny). */
export function parseNames(value: string | null | undefined): string[] | null {
  const names = (value ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
  return names.length ? names : null
}

const sameName = (a: string, b: string) => a.localeCompare(b, 'cs', { sensitivity: 'base' }) === 0

async function findCalendar(name: string): Promise<DAVCalendar> {
  let cals = await fetchCalendarsCached()
  let cal = cals.find((c) => sameName(displayName(c), name))
  if (!cal) {
    cals = await fetchCalendarsCached(true)
    cal = cals.find((c) => sameName(displayName(c), name))
  }
  if (!cal) throw new Error(`Kalendář „${name}“ nebyl nalezen. Dostupné: ${cals.map(displayName).join(', ') || 'žádné'}.`)
  return cal
}

/** Surová data událostí (iCal text) z vybraných kalendářů v daném rozsahu. */
export async function fetchCaldavEvents(
  rangeStart: Date,
  rangeEnd: Date,
  names: string[] | null,
): Promise<{ calendars: string[]; ics: string[] }> {
  const client = await getClient()
  const all = await fetchCalendarsCached()
  const selected = names ? all.filter((c) => names.some((n) => sameName(displayName(c), n))) : all
  if (names && selected.length < names.length) {
    const missing = names.filter((n) => !all.some((c) => sameName(displayName(c), n)))
    if (missing.length) throw new Error(`Kalendář nenalezen: ${missing.join(', ')}. Dostupné: ${all.map(displayName).join(', ')}.`)
  }
  const ics: string[] = []
  try {
    for (const calendar of selected) {
      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange: { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
      })
      for (const o of objects) if (typeof o.data === 'string' && o.data) ics.push(o.data)
    }
  } catch (err) {
    clientPromise = null
    throw humanize(err)
  }
  return { calendars: selected.map(displayName), ics }
}

/** Zapíše událost do kalendáře. Vrací adresu a etag pro pozdější smazání. */
export async function putEvent(calendarName: string, uid: string, icsText: string): Promise<{ url: string; etag?: string }> {
  const client = await getClient()
  const calendar = await findCalendar(calendarName)
  const filename = `${uid.replace(/[^A-Za-z0-9._-]/g, '_')}.ics`
  const res = await client.createCalendarObject({ calendar, filename, iCalString: icsText })
  if (!res.ok && res.status !== 412) {
    throw new Error(`Kalendář odmítl uložit událost (HTTP ${res.status}).`)
  }
  const base = calendar.url.endsWith('/') ? calendar.url : `${calendar.url}/`
  return { url: new URL(filename, base).toString(), etag: res.headers.get('etag') ?? undefined }
}

/** Smaže událost z kalendáře; když už neexistuje, je to v pořádku. */
export async function deleteEvent(url: string): Promise<void> {
  const client = await getClient()
  const res = await client.deleteCalendarObject({ calendarObject: { url, etag: undefined } })
  if (!res.ok && res.status !== 404) throw new Error(`Kalendář odmítl smazat událost (HTTP ${res.status}).`)
}

/** Jen pro testy – zapomene připojení a seznam kalendářů. */
export function resetCaldav() {
  clientPromise = null
  calendarsCache = null
}
