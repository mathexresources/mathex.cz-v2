import ical from 'node-ical'
import { describe, expect, it } from 'vitest'

import { buildCalendar } from '@/lib/ics'

const event = {
  uid: 'booking-1@mathex.cz',
  start: new Date('2026-10-26T08:00:00Z'),
  end: new Date('2026-10-26T08:30:00Z'),
  summary: 'Online videohovor: Mathex × Petr Novák, Instalatérství; dlouhý popis, který se musí zalomit',
  description: 'Řádek 1\nŘádek 2',
  location: 'https://meet.google.com/abc',
  organizer: { name: 'Mathex', email: 'ahoj@mathex.cz' },
  attendee: { name: 'Petr Novák', email: 'petr@example.com' },
}

describe('.ics', () => {
  it('vytvoří platnou pozvánku, kterou kalendáře přečtou', () => {
    const text = buildCalendar([event], { method: 'REQUEST' })
    expect(text).toContain('METHOD:REQUEST')
    expect(text.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true)

    const parsed = Object.values(ical.sync.parseICS(text)).find((x) => x?.type === 'VEVENT') as unknown as {
      summary: string
      description: string
      start: Date
      end: Date
      uid: string
      location: string
    }
    expect(parsed.uid).toBe(event.uid)
    expect(parsed.summary).toBe(event.summary)
    expect(parsed.description).toBe(event.description)
    expect(parsed.location).toBe(event.location)
    expect(new Date(parsed.start).toISOString()).toBe(event.start.toISOString())
    expect(new Date(parsed.end).toISOString()).toBe(event.end.toISOString())
  })

  it('zrušení má METHOD:CANCEL a vyšší SEQUENCE, bez připomínky', () => {
    const text = buildCalendar([{ ...event, status: 'CANCELLED', sequence: 1 }], { method: 'CANCEL' })
    expect(text).toContain('METHOD:CANCEL')
    expect(text).toContain('STATUS:CANCELLED')
    expect(text).toContain('SEQUENCE:1')
    expect(text).not.toContain('VALARM')
  })

  it('používá CRLF podle RFC 5545', () => {
    const text = buildCalendar([event])
    expect(text.includes('\r\n')).toBe(true)
    expect(text.replace(/\r\n/g, '').includes('\n')).toBe(false)
  })

  it('událost pro CalDAV nemá METHOD (RFC 4791)', () => {
    const text = buildCalendar([event], { method: null })
    expect(text).not.toContain('METHOD:')
    expect(text).toContain('BEGIN:VEVENT')
  })
})
