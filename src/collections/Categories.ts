import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateHooks } from '@/hooks/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategorie', plural: 'Kategorie' },
  admin: { useAsTitle: 'title', group: 'Blog' },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  hooks: revalidateHooks,
  fields: [
    { name: 'title', label: 'Název', type: 'text', required: true },
    slugField(),
    { name: 'description', label: 'Popis (pro SEO a výpis kategorie)', type: 'textarea' },
  ],
}
