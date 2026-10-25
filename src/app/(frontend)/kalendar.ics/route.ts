import { timingSafeEqual } from 'crypto'

import { buildCalendar } from '@/lib/ics'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Odběr rezervací do kalendáře (Google, Apple, Outlook).
 * V Google Kalendáři: Další kalendáře → Přidat podle URL → https://tvuj-web/kalendar.ics?token=…
 */
export async function GET(req: Request) {
  const expected = process.env.CALENDAR_FEED_TOKEN
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (
    !expected ||
    token.length !== expected.length ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    return new Response('Not found', { status: 404 })
  }

  const payload = await getPayloadClient()
  const from = new Date(Date.now() - 30 * 86400000).toISOString()
  const res = await payload.find({
    collection: 'bookings',
    where: { start: { greater_than: from } },
    limit: 1000,
    depth: 0,
    sort: 'start',
    overrideAccess: true,
  })
  const host = new URL(process.env.NEXT_PUBLIC_SITE_URL || req.url).hostname

  const ics = buildCalendar(
    res.docs.map((b) => ({
      uid: `booking-${b.id}@${host}`,
      start: new Date(b.start),
      end: new Date(b.end),
      summary: `${b.status === 'cancelled' ? '[ZRUŠENO] ' : ''}${b.meetingType}: ${b.name}${b.company ? ` (${b.company})` : ''}`,
      description: [b.email, b.phone, b.field, b.website, b.message].filter(Boolean).join('\n'),
      status: b.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
    })),
    { method: 'PUBLISH', name: 'Rezervace z webu' },
  )

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
    },
  })
}
