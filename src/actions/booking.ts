'use server'

import { randomBytes } from 'crypto'

import { sendBookingEmails, sendCancellationEmail } from '@/lib/booking-emails'
import { getBusyIntervals } from '@/lib/busy-calendar'
import { parseNames } from '@/lib/caldav'
import { getBookingSettings } from '@/lib/data'
import { clean, clientIp, isEmail, looksLikeBot, rateLimit, verifyTurnstile } from '@/lib/guard'
import { getPayloadClient } from '@/lib/payload'
import { computeSlots, type DaySlots, type Interval } from '@/lib/slots'

type MeetingType = { label: string; kind: string; durationMin: number; description?: string | null }

async function loadContext(typeIndex: number) {
  const settings = await getBookingSettings()
  const types = (settings.meetingTypes ?? []) as MeetingType[]
  const type = types[typeIndex]
  if (!settings.enabled || !type) return null

  const now = new Date()
  const rangeEnd = new Date(now.getTime() + ((settings.maxDaysAhead ?? 30) + 2) * 86400000)
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        { start: { less_than: rangeEnd.toISOString() } },
        { end: { greater_than: new Date(now.getTime() - 86400000).toISOString() } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    limit: 500,
    depth: 0,
    select: { start: true, end: true },
  })
  const bookings: Interval[] = existing.docs.map((d) => ({ start: new Date(d.start), end: new Date(d.end) }))
  const busy = await getBusyIntervals(now, rangeEnd, {
    sources: {
      icsUrls: (settings.icsUrls ?? []).map((c) => c.url).filter(Boolean),
      caldavCalendars: parseNames(settings.calendar?.busyCalendars),
    },
  })
  return { settings, type, bookings, busy, payload }
}

export async function getAvailableSlots(typeIndex: number): Promise<DaySlots[]> {
  const ctx = await loadContext(typeIndex)
  if (!ctx) return []
  return computeSlots({
    settings: ctx.settings as Parameters<typeof computeSlots>[0]['settings'],
    durationMin: ctx.type.durationMin,
    bookings: ctx.bookings,
    busy: ctx.busy,
  })
}

export type BookingState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<'name' | 'email' | 'phone' | 'consent' | 'slot', string>>
  booked?: { start: string; type: string; email: string }
  values?: Record<string, string>
}

export async function createBooking(_prev: BookingState, form: FormData): Promise<BookingState> {
  const ip = await clientIp()
  if (!rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000)) {
    return { status: 'error', message: 'Z vaší adresy přišlo moc rezervací. Zkuste to prosím za hodinu, nebo mi napište e-mail.' }
  }
  if (looksLikeBot(form)) {
    return { status: 'error', message: 'Formulář se nepodařilo odeslat. Počkejte pár vteřin a zkuste to znovu.' }
  }
  if (!(await verifyTurnstile(form, ip))) {
    return { status: 'error', message: 'Ověření, že nejste robot, se nepovedlo. Obnovte stránku a zkuste to znovu.' }
  }

  const typeIndex = Number(form.get('typeIndex'))
  const slot = clean(form.get('slot'), 40)
  const name = clean(form.get('name'), 120)
  const email = clean(form.get('email'), 200).toLowerCase()
  const phone = clean(form.get('phone'), 40)
  const company = clean(form.get('company'), 160)
  const field = clean(form.get('field'), 120)
  const website = clean(form.get('website'), 200)
  const message = clean(form.get('message'), 3000)
  const consent = form.get('consent') === 'on'

  const errors: BookingState['errors'] = {}
  if (!slot) errors.slot = 'Vyberte termín.'
  if (name.length < 2) errors.name = 'Napište své jméno.'
  if (!isEmail(email)) errors.email = 'Zkontrolujte e-mail, potvrzení přijde právě tam.'
  if (!consent) errors.consent = 'Bez souhlasu nemůžu rezervaci uložit.'

  const ctx = await loadContext(typeIndex)
  if (!ctx) return { status: 'error', message: 'Tento typ schůzky už není k dispozici. Obnovte stránku.' }
  if (ctx.type.kind === 'phone' && phone.replace(/\D/g, '').length < 9) {
    errors.phone = 'U telefonátu potřebuju vaše číslo.'
  }
  const values = { name, email, phone, company, field, website, message }
  if (Object.keys(errors).length) return { status: 'error', errors, values, message: 'Ve formuláři něco chybí.' }

  // Ověřit, že termín je pořád volný (mezitím ho mohl vzít někdo jiný)
  const available = computeSlots({
    settings: ctx.settings as Parameters<typeof computeSlots>[0]['settings'],
    durationMin: ctx.type.durationMin,
    bookings: ctx.bookings,
    busy: ctx.busy,
  })
  if (!available.some((d) => d.slots.includes(slot))) {
    return {
      status: 'error',
      errors: { slot: 'Tenhle termín mezitím někdo obsadil. Vyberte prosím jiný.' },
      values,
      message: 'Termín už není volný.',
    }
  }

  const start = new Date(slot)
  const end = new Date(start.getTime() + ctx.type.durationMin * 60000)
  const cancelToken = randomBytes(24).toString('base64url')

  const doc = await ctx.payload.create({
    collection: 'bookings',
    data: {
      start: start.toISOString(),
      end: end.toISOString(),
      meetingType: ctx.type.label,
      status: 'confirmed',
      name,
      email,
      phone,
      company,
      field,
      website,
      message,
      consent,
      cancelToken,
    },
    overrideAccess: true,
  })

  await sendBookingEmails(ctx.payload, doc as Parameters<typeof sendBookingEmails>[1], cancelToken)

  return { status: 'success', booked: { start: start.toISOString(), type: ctx.type.label, email } }
}

export type CancelState = { status: 'idle' | 'success' | 'error'; message?: string }

export async function cancelBooking(_prev: CancelState, form: FormData): Promise<CancelState> {
  const ip = await clientIp()
  if (!rateLimit(`cancel:${ip}`, 10, 60 * 60 * 1000)) {
    return { status: 'error', message: 'Příliš mnoho pokusů. Zkuste to později.' }
  }
  const token = clean(form.get('token'), 100)
  if (!token) return { status: 'error', message: 'Odkaz je neplatný.' }

  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'bookings',
    where: { cancelToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const booking = res.docs[0]
  if (!booking) return { status: 'error', message: 'Rezervaci se nepodařilo najít. Možná už byla zrušená.' }
  if (booking.status === 'cancelled') return { status: 'success', message: 'Rezervace už byla zrušená.' }
  if (new Date(booking.start).getTime() < Date.now()) {
    return { status: 'error', message: 'Tahle schůzka už proběhla.' }
  }

  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: { status: 'cancelled' },
    overrideAccess: true,
    context: { skipNotify: true },
  })
  await sendCancellationEmail(payload, booking as Parameters<typeof sendCancellationEmail>[1], 'client')
  return { status: 'success', message: 'Rezervace je zrušená. Potvrzení přijde e-mailem.' }
}
