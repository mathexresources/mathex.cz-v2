import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { revalidateHooks } from '@/hooks/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Reference', plural: 'Reference' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'company', 'rating'], group: 'Obsah' },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  hooks: revalidateHooks,
  fields: [
    { name: 'name', label: 'Jméno', type: 'text', required: true },
    { name: 'company', label: 'Firma / role', type: 'text' },
    { name: 'quote', label: 'Text reference', type: 'textarea', required: true },
    {
      name: 'rating',
      label: 'Hodnocení (1–5)',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        description:
          'Vyplň jen u skutečných hodnocení (např. přepsaných z Google). Používá se ve strukturovaných datech.',
      },
    },
    { name: 'photo', label: 'Fotka', type: 'upload', relationTo: 'media' },
    {
      name: 'source',
      label: 'Odkaz na původní recenzi',
      type: 'text',
    },
  ],
}
