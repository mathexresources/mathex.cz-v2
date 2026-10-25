import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateHooks } from '@/hooks/revalidate'
import { SEGMENTS } from '@/lib/segments'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Projekt', plural: 'Portfolio' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'segment', 'featured', 'order'],
    group: 'Obsah',
  },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  defaultSort: 'order',
  hooks: revalidateHooks,
  fields: [
    { name: 'title', label: 'Název projektu', type: 'text', required: true },
    { name: 'client', label: 'Klient', type: 'text', required: true },
    {
      name: 'segment',
      label: 'Obor',
      type: 'select',
      options: SEGMENTS.map((s) => ({ label: s.label, value: s.value })),
      required: true,
    },
    {
      name: 'summary',
      label: 'Shrnutí',
      type: 'textarea',
      required: true,
      admin: { description: 'Jedna až dvě věty do výpisu.' },
    },
    { name: 'cover', label: 'Hlavní obrázek (screenshot)', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      label: 'Galerie',
      type: 'array',
      fields: [{ name: 'image', label: 'Obrázek', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      type: 'row',
      fields: [
        { name: 'url', label: 'Adresa webu', type: 'text' },
        {
          name: 'isDemo',
          label: 'Ukázkový (demo) projekt',
          type: 'checkbox',
          admin: { description: 'Zobrazí se štítek „ukázka“, aby to bylo férové vůči návštěvníkům.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'deliveredInDays', label: 'Hotovo za (dní)', type: 'number', min: 1 },
        { name: 'pagespeedMobile', label: 'PageSpeed mobil', type: 'number', min: 0, max: 100 },
        { name: 'pagespeedDesktop', label: 'PageSpeed desktop', type: 'number', min: 0, max: 100 },
      ],
    },
    { name: 'challenge', label: 'Zadání', type: 'richText' },
    { name: 'solution', label: 'Řešení', type: 'richText' },
    { name: 'result', label: 'Výsledek', type: 'richText' },
    {
      name: 'stack',
      label: 'Použité technologie / funkce',
      type: 'array',
      fields: [{ name: 'item', label: 'Položka', type: 'text', required: true }],
    },
    {
      name: 'testimonial',
      label: 'Reference od klienta',
      type: 'relationship',
      relationTo: 'testimonials',
    },
    slugField(),
    {
      name: 'featured',
      label: 'Zobrazit na úvodní stránce',
      type: 'checkbox',
      defaultValue: false,
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
