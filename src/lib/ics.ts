/** Generování souborů .ics (pozvánka do kalendáře a odběr rezervací). */

const pad = (n: number) => String(n).padStart(2, '0')

export const icsDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes(),
  )}${pad(d.getUTCSeconds())}Z`

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Řádky delší než 75 bajtů se podle RFC 5545 zalamují. */
function fold(line: string): string {
  const bytes = new TextEncoder()
  if (bytes.encode(line).length <= 75) return line
  const out: string[] = []
  let current = ''
  for (const ch of line) {
    if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current)
      current = ch
    } else {
      current += ch
    }
  }
  out.push(current)
  return out.join('\r\n ')
}

export type IcsEvent = {
  uid: string
  start: Date
  end: Date
  summary: string
  description?: string
  location?: string
  url?: string
  status?: 'CONFIRMED' | 'CANCELLED'
  sequence?: number
  organizer?: { name: string; email: string }
  attendee?: { name: string; email: string }
}

function eventLines(e: IcsEvent): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(e.start)}`,
    `DTEND:${icsDate(e.end)}`,
    `SUMMARY:${escapeText(e.summary)}`,
    `STATUS:${e.status ?? 'CONFIRMED'}`,
    `SEQUENCE:${e.sequence ?? 0}`,
  ]
  if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`)
  if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`)
  if (e.url) lines.push(`URL:${e.url}`)
  if (e.organizer)
    lines.push(`ORGANIZER;CN=${escapeText(e.organizer.name)}:mailto:${e.organizer.email}`)
  if (e.attendee)
    lines.push(
      `ATTENDEE;CN=${escapeText(e.attendee.name)};ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:${e.attendee.email}`,
    )
  if (e.status !== 'CANCELLED') {
    lines.push('BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Připomínka', 'END:VALARM')
  }
  lines.push('END:VEVENT')
  return lines
}

export function buildCalendar(
  events: IcsEvent[],
  opts: { method?: 'REQUEST' | 'CANCEL' | 'PUBLISH'; name?: string } = {},
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mathex//Rezervace//CS',
    'CALSCALE:GREGORIAN',
    `METHOD:${opts.method ?? 'PUBLISH'}`,
  ]
  if (opts.name) lines.push(`X-WR-CALNAME:${escapeText(opts.name)}`)
  for (const e of events) lines.push(...eventLines(e))
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
