import type { Payload } from 'payload'

import { caldavConfigured, deleteEvent, putEvent } from './caldav'
import { env } from './env'
import { buildCalendar } from './ics'

type BookingLike = {
  id: number | string
  start: string
  end: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  field?: string | null
  website?: string | null
  message?: string | null
  meetingType: string
  calendarEventUrl?: string | null
}

const uidFor = (b: BookingLike) => `mathex-booking-${b.id}@${new URL(env.siteUrl).hostname}`

async function targetCalendar(payload: Payload): Promise<string | null> {
  if (!caldavConfigured()) return null
  const settings = await payload.findGlobal({ slug: 'booking-settings', depth: 0, overrideAccess: true })
  const name = (settings.calendar?.bookingCalendar ?? '').trim()
  return name || null
}

/** Událost v tvém kalendáři: bez pozvánky pro klienta, kontakty v popisu. */
export function bookingEventIcs(b: BookingLike, location?: string | null) {
  return buildCalendar(
    [
      {
        uid: uidFor(b),
        start: new Date(b.start),
        end: new Date(b.end),
        summary: `${b.meetingType}: ${b.name}${b.company ? ` (${b.company})` : ''}`,
        description: [
          b.email,
          b.phone,
          b.field && `Obor: ${b.field}`,
          b.website && `Web: ${b.website}`,
          b.message && `\n${b.message}`,
          `\nAdministrace: ${env.siteUrl}/admin/collections/bookings/${b.id}`,
        ]
          .filter(Boolean)
          .join('\n'),
        location: location ?? undefined,
        url: `${env.siteUrl}/admin/collections/bookings/${b.id}`,
      },
    ],
    { method: null },
  )
}

/** Zapíše rezervaci do kalendáře v iPhonu. Vrací adresu události, nebo null. */
export async function addBookingToCalendar(payload: Payload, b: BookingLike): Promise<string | null> {
  const calendar = await targetCalendar(payload)
  if (!calendar) return null
  const settings = await payload.findGlobal({ slug: 'booking-settings', depth: 0, overrideAccess: true })
  const type = (settings.meetingTypes ?? []).find((t) => t.label === b.meetingType)
  const { url } = await putEvent(calendar, uidFor(b), bookingEventIcs(b, type?.location))
  return url
}

export async function removeBookingFromCalendar(b: BookingLike): Promise<void> {
  if (!b.calendarEventUrl || !caldavConfigured()) return
  await deleteEvent(b.calendarEventUrl)
}
