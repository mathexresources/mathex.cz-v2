import type { Payload } from 'payload'

import { renderEmail } from './email-template'
import { buildCalendar, type IcsEvent } from './ics'
import { formatDateTime } from './time'

type BookingDoc = {
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
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function context(payload: Payload) {
  const [site, booking] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.findGlobal({ slug: 'booking-settings', depth: 0 }),
  ])
  const brand = (site.brandName as string) || 'Mathex'
  const ownerEmail = (booking.notifyEmail as string) || (site.email as string)
  const footer = [
    `${site.ownerName} · IČO ${site.ico}`,
    [site.phone, site.email].filter(Boolean).join(' · '),
    siteUrl(),
  ]
    .filter(Boolean)
    .join('\n')
  const types = (booking.meetingTypes as { label: string; location?: string; description?: string }[]) ?? []
  return { site, brand, ownerEmail, footer, types }
}

function icsFor(b: BookingDoc, brand: string, ownerEmail: string, location: string | undefined, status: IcsEvent['status']) {
  return buildCalendar(
    [
      {
        uid: `booking-${b.id}@${new URL(siteUrl()).hostname}`,
        start: new Date(b.start),
        end: new Date(b.end),
        summary: `${b.meetingType}: ${brand} × ${b.name}`,
        description: b.message ?? '',
        location,
        status,
        sequence: status === 'CANCELLED' ? 1 : 0,
        organizer: { name: brand, email: ownerEmail },
        attendee: { name: b.name, email: b.email },
      },
    ],
    { method: status === 'CANCELLED' ? 'CANCEL' : 'REQUEST' },
  )
}

export async function sendBookingEmails(payload: Payload, b: BookingDoc, cancelToken: string) {
  const { brand, ownerEmail, footer, types } = await context(payload)
  const type = types.find((t) => t.label === b.meetingType)
  const when = formatDateTime(b.start)
  const cancelUrl = `${siteUrl()}/rezervace/zrusit?token=${encodeURIComponent(cancelToken)}`
  const ics = icsFor(b, brand, ownerEmail, type?.location, 'CONFIRMED')

  const client = renderEmail({
    brand,
    heading: 'Konzultace je zarezervovaná',
    intro: `Dobrý den, ${b.name},\ntěším se na naši schůzku. Pozvánku do kalendáře najdete v příloze.`,
    rows: [
      { label: 'Kdy', value: when },
      { label: 'Typ', value: b.meetingType },
      { label: 'Kde', value: type?.location || type?.description || '' },
    ],
    action: { label: 'Zrušit nebo přesunout termín', url: cancelUrl },
    footer,
  })

  const owner = renderEmail({
    brand,
    heading: `Nová rezervace: ${b.name}`,
    intro: `${when} · ${b.meetingType}`,
    rows: [
      { label: 'Jméno', value: b.name },
      { label: 'E-mail', value: b.email },
      { label: 'Telefon', value: b.phone ?? '' },
      { label: 'Firma', value: b.company ?? '' },
      { label: 'Obor', value: b.field ?? '' },
      { label: 'Web', value: b.website ?? '' },
      { label: 'Zpráva', value: b.message ?? '' },
    ],
    action: { label: 'Otevřít v administraci', url: `${siteUrl()}/admin/collections/bookings/${b.id}` },
  })

  const attachment = { filename: 'schuzka.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=REQUEST' }

  await Promise.allSettled([
    payload.sendEmail({ to: b.email, subject: `Potvrzení konzultace – ${when}`, ...client, attachments: [attachment] }),
    payload.sendEmail({ to: ownerEmail, replyTo: b.email, subject: `Rezervace: ${b.name} – ${when}`, ...owner, attachments: [attachment] }),
  ]).then((results) =>
    results.forEach((r) => r.status === 'rejected' && console.error('[rezervace] E-mail se neodeslal:', r.reason)),
  )
}

export async function sendCancellationEmail(payload: Payload, b: BookingDoc, by: 'client' | 'admin') {
  try {
    const { brand, ownerEmail, footer, types } = await context(payload)
    const type = types.find((t) => t.label === b.meetingType)
    const when = formatDateTime(b.start)
    const ics = icsFor(b, brand, ownerEmail, type?.location, 'CANCELLED')
    const attachment = { filename: 'zruseni.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=CANCEL' }

    const client = renderEmail({
      brand,
      heading: 'Konzultace je zrušená',
      intro:
        by === 'client'
          ? `Dobrý den, ${b.name},\nrezervace na ${when} je zrušená. Pokud chcete jiný termín, vyberte si nový.`
          : `Dobrý den, ${b.name},\nomlouvám se, termín ${when} se musí zrušit. Vyberte si prosím jiný, který vám vyhovuje.`,
      action: { label: 'Vybrat nový termín', url: `${siteUrl()}/rezervace` },
      footer,
    })
    const owner = renderEmail({
      brand,
      heading: `Zrušená rezervace: ${b.name}`,
      intro: `${when} · ${b.meetingType}\nZrušil(a): ${by === 'client' ? 'klient' : 'administrace'}`,
    })

    await Promise.allSettled([
      payload.sendEmail({ to: b.email, subject: `Zrušení konzultace – ${when}`, ...client, attachments: [attachment] }),
      payload.sendEmail({ to: ownerEmail, subject: `Zrušeno: ${b.name} – ${when}`, ...owner, attachments: [attachment] }),
    ])
  } catch (err) {
    console.error('[rezervace] E-mail o zrušení se neodeslal:', err)
  }
}

export async function sendInquiryEmails(
  payload: Payload,
  i: { id: string | number; name: string; email: string; phone?: string; company?: string; budget?: string; deadline?: string; message: string; source?: string },
) {
  const { brand, ownerEmail, footer } = await context(payload)
  const owner = renderEmail({
    brand,
    heading: `Nová poptávka: ${i.name}`,
    intro: i.message,
    rows: [
      { label: 'E-mail', value: i.email },
      { label: 'Telefon', value: i.phone ?? '' },
      { label: 'Firma', value: i.company ?? '' },
      { label: 'Rozpočet', value: i.budget ?? '' },
      { label: 'Termín', value: i.deadline ?? '' },
      { label: 'Stránka', value: i.source ?? '' },
    ],
    action: { label: 'Otevřít v administraci', url: `${siteUrl()}/admin/collections/inquiries/${i.id}` },
  })
  const client = renderEmail({
    brand,
    heading: 'Děkuji, zpráva dorazila',
    intro: `Dobrý den, ${i.name},\nozvu se vám nejpozději do jednoho pracovního dne. Pokud to spěchá, rovnou si zarezervujte krátký hovor.`,
    action: { label: 'Rezervovat konzultaci', url: `${siteUrl()}/rezervace` },
    footer,
  })
  await Promise.allSettled([
    payload.sendEmail({ to: ownerEmail, replyTo: i.email, subject: `Poptávka: ${i.name}`, ...owner }),
    payload.sendEmail({ to: i.email, subject: `Vaše zpráva pro ${brand}`, ...client }),
  ]).then((results) =>
    results.forEach((r) => r.status === 'rejected' && console.error('[poptávka] E-mail se neodeslal:', r.reason)),
  )
}
