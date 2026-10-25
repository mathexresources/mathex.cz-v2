import type { CollectionConfig } from 'payload'

import { isLoggedIn, publishedOrLoggedIn } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateHooks } from '@/hooks/revalidate'
import { env } from '@/lib/env'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Článek', plural: 'Články' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Blog',
    preview: (doc) =>
      doc?.slug ? `${env.siteUrl}/blog/${doc.slug}` : null,
  },
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  versions: {
    drafts: { autosave: { interval: 2000 } },
    maxPerDoc: 30,
  },
  defaultSort: '-publishedAt',
  hooks: {
    ...revalidateHooks,
    beforeChange: [
      ({ data }) => {
        // Při prvním zveřejnění doplní datum publikace
        if (data._status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Titulek', type: 'text', required: true },
    {
      name: 'excerpt',
      label: 'Perex',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'Krátké shrnutí do výpisu článků (1–2 věty).' },
    },
    { name: 'cover', label: 'Úvodní obrázek', type: 'upload', relationTo: 'media' },
    { name: 'content', label: 'Obsah', type: 'richText', required: true },
    slugField(),
    {
      name: 'publishedAt',
      label: 'Datum publikace',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'category',
      label: 'Kategorie',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
    },
    {
      name: 'author',
      label: 'Autor',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'relatedService',
      label: 'Související služba (CTA na konci článku)',
      type: 'relationship',
      relationTo: 'services',
      admin: { position: 'sidebar' },
    },
  ],
}
