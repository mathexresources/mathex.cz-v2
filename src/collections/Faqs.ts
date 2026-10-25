import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { revalidateHooks } from '@/hooks/revalidate'

export const FAQ_TOPICS = [
  { value: 'cena', label: 'Cena a platba' },
  { value: 'prubeh', label: 'Průběh spolupráce' },
  { value: 'technika', label: 'Technika a provoz' },
  { value: 'prednasky', label: 'Přednášky' },
  { value: 'obor', label: 'Oborové' },
] as const

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Otázka', plural: 'Časté otázky' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'topic', 'order'], group: 'Obsah' },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  defaultSort: 'order',
  hooks: revalidateHooks,
  fields: [
    { name: 'question', label: 'Otázka', type: 'text', required: true },
    {
      name: 'answer',
      label: 'Odpověď',
      type: 'textarea',
      required: true,
      admin: { description: 'Prostý text – používá se i pro rozšířené výsledky Google (FAQ).' },
    },
    {
      name: 'topic',
      label: 'Téma',
      type: 'select',
      options: FAQ_TOPICS.map((t) => ({ label: t.label, value: t.value })),
      defaultValue: 'prubeh',
      required: true,
    },
    {
      name: 'showOnFaqPage',
      label: 'Zobrazit na stránce FAQ',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      label: 'Pořadí',
      type: 'number',
      defaultValue: 10,
      admin: { position: 'sidebar' },
    },
  ],
}
