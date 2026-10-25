import type { GlobalConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'O mně',
  admin: { group: 'Stránky' },
  access: { read: anyone, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'headline',
      label: 'Nadpis',
      type: 'text',
      required: true,
      defaultValue: 'Jsem vývojář, který píše weby pro lidi, co mají plné ruce práce',
    },
    { name: 'photo', label: 'Fotka', type: 'upload', relationTo: 'media' },
    { name: 'body', label: 'Text', type: 'richText' },
    {
      name: 'facts',
      label: 'Fakta (krátké údaje vedle fotky)',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Popisek', type: 'text', required: true },
            { name: 'value', label: 'Hodnota', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'principles',
      label: 'Jak pracuju',
      type: 'array',
      fields: [
        { name: 'title', label: 'Zásada', type: 'text', required: true },
        { name: 'text', label: 'Vysvětlení', type: 'textarea', required: true },
      ],
    },
  ],
}
