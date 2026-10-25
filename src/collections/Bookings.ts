import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '@/access'
import { addBookingToCalendar, removeBookingFromCalendar } from '@/lib/booking-calendar'
import { sendCancellationEmail } from '@/lib/booking-emails'
import { resetBusyCache } from '@/lib/busy-calendar'

export const BOOKING_STATUSES = [
  { value: 'confirmed', label: 'Potvrzeno' },
  { value: 'done', label: 'Proběhlo' },
  { value: 'cancelled', label: 'Zrušeno' },
  { value: 'no-show', label: 'Nedostavil se' },
] as const

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Rezervace', plural: 'Rezervace' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['start', 'name', 'meetingType', 'status', 'company'],
    group: 'Klienti',
    listSearchableFields: ['name', 'email', 'company'],
  },
  // Veřejnost rezervuje přes serverovou akci (s validací), ne přímo přes API.
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  defaultSort: '-start',
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context?.skipCalendar) return doc
        // Rezervace mění obsazenost – další návštěvník musí vidět aktuální stav
        resetBusyCache()
        const log = (msg: string, err: unknown) =>
          req.payload.logger.error(`[kalendář] ${msg}: ${err instanceof Error ? err.message : String(err)}`)

        // Nová (nezrušená) rezervace → zapsat do kalendáře v iPhonu
        if (operation === 'create' && doc.status !== 'cancelled') {
          try {
            const url = await addBookingToCalendar(req.payload, doc)
            if (url) {
              await req.payload.update({
                collection: 'bookings',
                id: doc.id,
                data: { calendarEventUrl: url },
                overrideAccess: true,
                req,
                context: { skipCalendar: true, skipNotify: true },
              })
              doc.calendarEventUrl = url
            }
          } catch (err) {
            log('Rezervaci se nepodařilo zapsat do kalendáře', err)
          }
        }

        // Zrušení (klientem i v administraci) → smazat z kalendáře
        if (operation === 'update' && previousDoc?.status !== 'cancelled' && doc.status === 'cancelled') {
          try {
            await removeBookingFromCalendar(previousDoc?.calendarEventUrl ? previousDoc : doc)
          } catch (err) {
            log('Rezervaci se nepodařilo smazat z kalendáře', err)
          }
          if (!context?.skipNotify) await sendCancellationEmail(req.payload, doc, 'admin')
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          await removeBookingFromCalendar(doc)
        } catch (err) {
          req.payload.logger.error(`[kalendář] Smazanou rezervaci se nepodařilo odebrat z kalendáře: ${String(err)}`)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'start',
          label: 'Začátek',
          type: 'date',
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd. M. yyyy HH:mm' } },
        },
        {
          name: 'end',
          label: 'Konec',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd. M. yyyy HH:mm' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'meetingType', label: 'Typ schůzky', type: 'text', required: true },
        {
          name: 'status',
          label: 'Stav',
          type: 'select',
          options: BOOKING_STATUSES.map((s) => ({ label: s.label, value: s.value })),
          defaultValue: 'confirmed',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Jméno', type: 'text', required: true },
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { name: 'phone', label: 'Telefon', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'company', label: 'Firma', type: 'text' },
        { name: 'field', label: 'Obor', type: 'text' },
        { name: 'website', label: 'Současný web', type: 'text' },
      ],
    },
    { name: 'message', label: 'Co potřebuje', type: 'textarea' },
    { name: 'internalNotes', label: 'Moje poznámky', type: 'textarea' },
    {
      name: 'cancelToken',
      type: 'text',
      index: true,
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
    {
      name: 'calendarEventUrl',
      label: 'Událost v kalendáři',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Vyplní se, když se rezervace zapíše do kalendáře v iPhonu.',
        condition: (data) => Boolean(data?.calendarEventUrl),
      },
    },
    {
      name: 'consent',
      label: 'Souhlas se zpracováním údajů',
      type: 'checkbox',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
