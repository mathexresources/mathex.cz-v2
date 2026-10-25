import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateHooks } from '@/hooks/revalidate'
import { SEGMENTS } from '@/lib/segments'

/** Landing page pro jednotlivé obory – každá cílí na vlastní klíčová slova. */
export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Služba', plural: 'Služby (landing pages)' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'segment', 'order'],
    group: 'Obsah',
  },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  defaultSort: 'order',
  hooks: revalidateHooks,
  fields: [
    {
      name: 'title',
      label: 'Název (např. Weby pro řemeslníky)',
      type: 'text',
      required: true,
    },
    {
      name: 'segment',
      label: 'Obor',
      type: 'select',
      options: SEGMENTS.map((s) => ({ label: s.label, value: s.value })),
      required: true,
    },
    {
      name: 'headline',
      label: 'Hlavní nadpis stránky (H1)',
      type: 'text',
      required: true,
    },
    { name: 'intro', label: 'Úvodní odstavec', type: 'textarea', required: true },
    {
      name: 'shortDescription',
      label: 'Krátký popis do výpisu',
      type: 'textarea',
      required: true,
    },
    {
      name: 'painPoints',
      label: 'Co klienta trápí',
      type: 'array',
      fields: [{ name: 'text', label: 'Text', type: 'text', required: true }],
    },
    {
      name: 'features',
      label: 'Co web umí',
      type: 'array',
      fields: [
        { name: 'title', label: 'Název', type: 'text', required: true },
        { name: 'text', label: 'Popis', type: 'textarea', required: true },
      ],
    },
    { name: 'body', label: 'Další obsah', type: 'richText' },
    {
      name: 'faqs',
      label: 'Otázky a odpovědi k tomuto oboru',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
    },
    slugField(),
    {
      name: 'order',
      label: 'Pořadí',
      type: 'number',
      defaultValue: 10,
      admin: { position: 'sidebar' },
    },
  ],
}
