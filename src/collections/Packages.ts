import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { revalidateHooks } from '@/hooks/revalidate'

export const Packages: CollectionConfig = {
  slug: 'packages',
  labels: { singular: 'Balíček', plural: 'Ceník' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'deliveryDays', 'order'],
    group: 'Obsah',
  },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  defaultSort: 'order',
  hooks: revalidateHooks,
  fields: [
    { name: 'name', label: 'Název balíčku', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'price', label: 'Cena (Kč)', type: 'number', required: true, min: 0 },
        {
          name: 'priceFrom',
          label: 'Cena „od“',
          type: 'checkbox',
          defaultValue: true,
        },
        { name: 'deliveryDays', label: 'Dodání do (pracovních dní)', type: 'number', min: 1 },
      ],
    },
    {
      name: 'priceNote',
      label: 'Poznámka k ceně',
      type: 'text',
      admin: { description: 'Např. „Nejsem plátce DPH.“ nebo „+ 490 Kč měsíčně za správu“.' },
    },
    { name: 'description', label: 'Pro koho to je', type: 'textarea', required: true },
    {
      name: 'features',
      label: 'Co obsahuje',
      type: 'array',
      fields: [{ name: 'text', label: 'Položka', type: 'text', required: true }],
    },
    {
      name: 'highlighted',
      label: 'Doporučený balíček',
      type: 'checkbox',
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
