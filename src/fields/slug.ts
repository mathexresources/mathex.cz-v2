import type { Field } from 'payload'

import { slugify } from '@/lib/slugify'

/** Pole „slug“ (část URL). Když zůstane prázdné, vytvoří se z titulku. */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  label: 'URL adresa (slug)',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Vyplní se automaticky z názvu. Po zveřejnění raději neměň – rozbily by se odkazy.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = data?.[sourceField]
        return typeof source === 'string' ? slugify(source) : value
      },
    ],
  },
})
