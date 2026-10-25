import type { CollectionConfig } from 'payload'

import { isLoggedIn } from '@/access'

export const INQUIRY_STATUSES = [
  { value: 'new', label: 'Nová' },
  { value: 'contacted', label: 'Kontaktováno' },
  { value: 'offer', label: 'Poslaná nabídka' },
  { value: 'won', label: 'Zakázka' },
  { value: 'lost', label: 'Nevyšlo' },
] as const

/** Jednoduché mini-CRM pro poptávky z kontaktního formuláře. */
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'Poptávka', plural: 'Poptávky' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'name', 'company', 'budget', 'status'],
    group: 'Klienti',
    listSearchableFields: ['name', 'email', 'company'],
  },
  access: {
    read: isLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      label: 'Stav',
      type: 'select',
      options: INQUIRY_STATUSES.map((s) => ({ label: s.label, value: s.value })),
      defaultValue: 'new',
      required: true,
      admin: { position: 'sidebar' },
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
        { name: 'budget', label: 'Rozpočet', type: 'text' },
        { name: 'deadline', label: 'Termín', type: 'text' },
      ],
    },
    { name: 'message', label: 'Zpráva', type: 'textarea', required: true },
    { name: 'source', label: 'Odesláno ze stránky', type: 'text', admin: { readOnly: true } },
    { name: 'internalNotes', label: 'Moje poznámky', type: 'textarea' },
    {
      name: 'consent',
      label: 'Souhlas se zpracováním údajů',
      type: 'checkbox',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
