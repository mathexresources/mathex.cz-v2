import type { CollectionConfig } from 'payload'

import { isLoggedIn, publishedOrLoggedIn } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateHooks } from '@/hooks/revalidate'

/** Jednoduché textové stránky – zásady ochrany osobních údajů, cookies, podmínky apod. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Stránka', plural: 'Textové stránky' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Obsah',
  },
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  versions: { drafts: true },
  hooks: revalidateHooks,
  fields: [
    { name: 'title', label: 'Titulek', type: 'text', required: true },
    { name: 'intro', label: 'Úvod', type: 'textarea' },
    { name: 'content', label: 'Obsah', type: 'richText', required: true },
    slugField(),
    {
      name: 'showInFooter',
      label: 'Odkaz v patičce',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
