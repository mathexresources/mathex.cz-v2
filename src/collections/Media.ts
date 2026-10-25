import path from 'path'
import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Soubor', plural: 'Média' },
  admin: { group: 'Obsah' },
  access: {
    read: anyone,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  upload: {
    staticDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 480, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'wide', width: 1920, formatOptions: { format: 'webp', options: { quality: 80 } } },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
        formatOptions: { format: 'jpeg', options: { quality: 82 } },
      },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    {
      name: 'alt',
      label: 'Popis obrázku (alt)',
      type: 'text',
      required: true,
      admin: {
        description: 'Krátce popiš, co je na obrázku. Pomáhá nevidomým i vyhledávačům.',
      },
    },
    { name: 'caption', label: 'Popisek', type: 'text' },
  ],
}
