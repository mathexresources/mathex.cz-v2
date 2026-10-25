import ical from 'node-ical'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getBusyIntervals, parseBusy, resetBusyCache } from '@/lib/busy-calendar'

// Kalendář ve stylu exportu z Google Kalendáře
const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Google Inc//Google Calendar 70.9054//EN',
  // běžná schůzka
  'BEGIN:VEVENT',
  'UID:meeting@test',
  'DTSTART:20261027T080000Z',
  'DTEND:20261027T090000Z',
  'SUMMARY:Zubař',
  'END:VEVENT',
  // každé pondělí 13–14 h, jeden výskyt vynechaný
  'BEGIN:VEVENT',
  'UID:weekly@test',
  'DTSTART:20261026T120000Z',
  'DTEND:20261026T130000Z',
  'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4',
  'EXDATE:20261102T120000Z',
  'SUMMARY:Trénink',
  'END:VEVENT',
  // označené jako „volno“ → neblokuje
  'BEGIN:VEVENT',
  'UID:free@test',
  'DTSTART:20261028T080000Z',
  'DTEND:20261028T100000Z',
  'TRANSP:TRANSPARENT',
  'SUMMARY:Připomínka',
  'END:VEVENT',
  // zrušené → neblokuje
  'BEGIN:VEVENT',
  'UID:cancelled@test',
  'DTSTART:20261029T080000Z',
  'DTEND:20261029T100000Z',
  'STATUS:CANCELLED',
  'END:VEVENT',
  // mimo rozsah → nepočítá se
  'BEGIN:VEVENT',
  'UID:old@test',
  'DTSTART:20250101T080000Z',
  'DTEND:20250101T090000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

const from = new Date('2026-10-25T00:00:00Z')
const to = new Date('2026-11-30T00:00:00Z')

afterEach(() => {
  delete process.env.BUSY_CALENDAR_ICS_URL
  resetBusyCache()
  vi.restoreAllMocks()
})

describe('obsazenost z kalendáře', () => {
  it('načte schůzky a opakování, přeskočí volno, zrušené a vynechané', () => {
    const busy = parseBusy(ICS, ical, from, to).map((i) => i.start.toISOString()).sort()
    expect(busy).toEqual([
      '2026-10-26T12:00:00.000Z',
      '2026-10-27T08:00:00.000Z',
      '2026-11-09T12:00:00.000Z',
      '2026-11-16T12:00:00.000Z',
    ])
  })

  it('bez adresy kalendáře nic nestahuje', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    expect(await getBusyIntervals(from, to)).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('stáhne kalendář a výsledek 5 minut drží v paměti', async () => {
    process.env.BUSY_CALENDAR_ICS_URL = 'https://calendar.example/basic.ics'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(ICS))
    expect(await getBusyIntervals(from, to)).toHaveLength(4)
    expect(await getBusyIntervals(from, to)).toHaveLength(4)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('při výpadku rezervace nespadnou (vrátí poslední známý stav)', async () => {
    process.env.BUSY_CALENDAR_ICS_URL = 'https://calendar.example/basic.ics'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await getBusyIntervals(from, to)).toEqual([])
  })

  it('kontrola v administraci chybu nahlásí', async () => {
    process.env.BUSY_CALENDAR_ICS_URL = 'https://calendar.example/basic.ics'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>login</html>'))
    await expect(getBusyIntervals(from, to, { throwOnError: true })).rejects.toThrow(/iCal/)
  })
})

describe('adresy kalendářů', () => {
  it('webcal:// převede na https://', async () => {
    const { normalizeIcsUrl } = await import('@/lib/busy-calendar')
    expect(normalizeIcsUrl(' webcal://p01-caldav.icloud.com/published/2/abc ')).toBe('https://p01-caldav.icloud.com/published/2/abc')
    expect(normalizeIcsUrl('https://x.cz/a.ics')).toBe('https://x.cz/a.ics')
  })

  it('spojí více kalendářů a nahlásí ten, který nejde načíst', async () => {
    const good = 'https://calendar.example/good.ics'
    const bad = 'webcal://calendar.example/bad.ics'
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).includes('good') ? new Response(ICS) : new Response('x', { status: 404 }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const report: { source: string; ok: boolean; count: number }[] = []
    const busy = await getBusyIntervals(from, to, { sources: { icsUrls: [good, bad] }, report })
    expect(busy).toHaveLength(4)
    expect(report.find((r) => r.source === good)?.ok).toBe(true)
    expect(report.find((r) => r.source.includes('bad'))?.ok).toBe(false)
  })
})
