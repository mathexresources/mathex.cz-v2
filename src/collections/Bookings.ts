import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '@/access'
import { sendCancellationEmail } from '@/lib/booking-emails'

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
        if (
          operation === 'update' &&
          !context?.skipNotify &&
          previousDoc?.status !== 'cancelled' &&
          doc.status === 'cancelled'
        ) {
          await sendCancellationEmail(req.payload, doc, 'admin')
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
      name: 'consent',
      label: 'Souhlas se zpracováním údajů',
      type: 'checkbox',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
