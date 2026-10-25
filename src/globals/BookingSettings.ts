import type { GlobalConfig } from 'payload'

import { isLoggedIn } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const WEEKDAYS = [
  { value: '1', label: 'Pondělí' },
  { value: '2', label: 'Úterý' },
  { value: '3', label: 'Středa' },
  { value: '4', label: 'Čtvrtek' },
  { value: '5', label: 'Pátek' },
  { value: '6', label: 'Sobota' },
  { value: '0', label: 'Neděle' },
] as const

const timeValidate = (value: unknown) =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? true
    : 'Zadej čas ve formátu HH:MM, např. 09:00'

export const BookingSettings: GlobalConfig = {
  slug: 'booking-settings',
  label: 'Nastavení rezervací',
  admin: { group: 'Nastavení' },
  // Web čte nastavení interně – přes API ho vidí jen přihlášený (poznámky, adresy kalendářů)
  access: { read: isLoggedIn, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'enabled',
      label: 'Rezervace zapnuté',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'meetingTypes',
      label: 'Typy schůzek',
      type: 'array',
      minRows: 1,
      defaultValue: [
        { label: 'Online videohovor', kind: 'online', durationMin: 30, description: 'Google Meet, odkaz přijde e-mailem.' },
        { label: 'Telefonát', kind: 'phone', durationMin: 20, description: 'Zavolám vám na zadané číslo.' },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Název', type: 'text', required: true },
            {
              name: 'kind',
              label: 'Druh',
              type: 'select',
              required: true,
              options: [
                { label: 'Online', value: 'online' },
                { label: 'Telefon', value: 'phone' },
                { label: 'Osobně', value: 'inperson' },
              ],
            },
            { name: 'durationMin', label: 'Délka (min)', type: 'number', required: true, min: 10, max: 240 },
          ],
        },
        { name: 'description', label: 'Popis pro klienta', type: 'text' },
        {
          name: 'location',
          label: 'Místo / odkaz na schůzku',
          type: 'text',
          admin: {
            description: 'Např. stálý odkaz na Google Meet nebo adresa kavárny. Pošle se v potvrzení.',
          },
        },
      ],
    },
    {
      name: 'workingHours',
      label: 'Kdy jsem k dispozici',
      type: 'array',
      defaultValue: ['1', '2', '3', '4', '5'].map((day) => ({ day, from: '09:00', to: '17:00' })),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              label: 'Den',
              type: 'select',
              required: true,
              options: WEEKDAYS.map((d) => ({ label: d.label, value: d.value })),
            },
            { name: 'from', label: 'Od', type: 'text', required: true, validate: timeValidate },
            { name: 'to', label: 'Do', type: 'text', required: true, validate: timeValidate },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'slotStepMin', label: 'Krok nabízených časů (min)', type: 'number', defaultValue: 30, min: 5 },
        { name: 'bufferMin', label: 'Pauza mezi schůzkami (min)', type: 'number', defaultValue: 15, min: 0 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'minNoticeHours', label: 'Nejdříve za (hodin)', type: 'number', defaultValue: 12, min: 0 },
        { name: 'maxDaysAhead', label: 'Nejpozději za (dní)', type: 'number', defaultValue: 30, min: 1 },
        { name: 'maxPerDay', label: 'Max. schůzek za den', type: 'number', defaultValue: 4, min: 1 },
      ],
    },
    {
      name: 'blackouts',
      label: 'Dovolená a volna',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'from', label: 'Od', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'to', label: 'Do (včetně)', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'reason', label: 'Poznámka', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'blockedTimes',
      label: 'Pevně blokované časy',
      labels: { singular: 'Blokace', plural: 'Blokované časy' },
      type: 'array',
      admin: {
        description:
          'Časy, kdy rezervace nechceš, i když máš v kalendáři volno – např. každé úterý 13:00–15:00, nebo jednou konkrétní den.',
        initCollapsed: false,
        components: { RowLabel: '@/components/admin/BlockedTimeRowLabel#BlockedTimeRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'repeat',
              label: 'Opakování',
              type: 'select',
              required: true,
              defaultValue: 'weekly',
              options: [
                { label: 'Každý týden', value: 'weekly' },
                { label: 'Jednou', value: 'once' },
              ],
              admin: { width: '25%' },
            },
            {
              name: 'day',
              label: 'Den',
              type: 'select',
              options: WEEKDAYS.map((d) => ({ label: d.label, value: d.value })),
              admin: { width: '25%', condition: (_, sibling) => sibling?.repeat !== 'once' },
              validate: (value: unknown, { siblingData }: { siblingData: { repeat?: string } }) =>
                siblingData?.repeat === 'once' || value ? true : 'Vyber den v týdnu',
            },
            {
              name: 'date',
              label: 'Datum',
              type: 'date',
              admin: {
                width: '25%',
                date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' },
                condition: (_, sibling) => sibling?.repeat === 'once',
              },
              validate: (value: unknown, { siblingData }: { siblingData: { repeat?: string } }) =>
                siblingData?.repeat !== 'once' || value ? true : 'Vyber datum',
            },
            { name: 'from', label: 'Od', type: 'text', required: true, validate: timeValidate, admin: { width: '15%' } },
            { name: 'to', label: 'Do', type: 'text', required: true, validate: timeValidate, admin: { width: '15%' } },
          ],
        },
        { name: 'note', label: 'Poznámka (jen pro tebe)', type: 'text' },
      ],
    },
    {
      name: 'calendar',
      label: 'Kalendář v iPhonu (iCloud)',
      type: 'group',
      admin: {
        description:
          'Připojení se nastavuje v .env na serveru (ICLOUD_USERNAME a ICLOUD_APP_PASSWORD). Stav uvidíš na nástěnce v Kontrole služeb.',
      },
      fields: [
        {
          name: 'busyCalendars',
          label: 'Které kalendáře blokují termíny',
          type: 'text',
          admin: {
            description:
              'Názvy kalendářů oddělené čárkou, přesně jak je máš v iPhonu (např. „Domov, Práce“). Prázdné = všechny.',
          },
        },
        {
          name: 'bookingCalendar',
          label: 'Do kterého kalendáře zapisovat rezervace',
          type: 'text',
          admin: {
            description: 'Název kalendáře v iPhonu. Prázdné = rezervace se do iCloudu nezapisují.',
          },
        },
      ],
    },
    {
      name: 'icsUrls',
      label: 'Další kalendáře podle adresy (iCal / webcal)',
      type: 'array',
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description:
          'Např. tajná iCal adresa Google Kalendáře nebo veřejný odkaz na sdílený kalendář iCloud. Obsazené časy se nenabízí.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Název', type: 'text', required: true, admin: { width: '30%' } },
            {
              name: 'url',
              label: 'Adresa',
              type: 'text',
              required: true,
              admin: { width: '70%' },
              validate: (v: unknown) =>
                typeof v === 'string' && /^(https?|webcal):\/\//i.test(v.trim())
                  ? true
                  : 'Adresa musí začínat https:// nebo webcal://',
            },
          ],
        },
      ],
    },
    {
      name: 'notifyEmail',
      label: 'Kam posílat upozornění na nové rezervace a poptávky',
      type: 'email',
      admin: { description: 'Když nevyplníš, použije se e-mail z Nastavení webu.' },
    },
  ],
}
