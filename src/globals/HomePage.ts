import type { GlobalConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Úvodní stránka',
  admin: { group: 'Stránky' },
  access: { read: anyone, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'heroTitle',
      label: 'Hlavní nadpis',
      type: 'textarea',
      required: true,
      defaultValue: 'Weby pro řemeslníky, restaurace a malé firmy. Hotové do dvou týdnů.',
    },
    {
      name: 'heroText',
      label: 'Text pod nadpisem',
      type: 'textarea',
      required: true,
      defaultValue:
        'Navrhnu a naprogramuju web, který se načte dřív, než zákazník stihne odejít ke konkurenci. Žádné šablony, žádné měsíční poplatky za stavebnici.',
    },
    {
      name: 'process',
      label: 'Průběh spolupráce',
      type: 'array',
      minRows: 2,
      fields: [
        { name: 'title', label: 'Krok', type: 'text', required: true },
        { name: 'text', label: 'Popis', type: 'textarea', required: true },
        { name: 'duration', label: 'Doba trvání', type: 'text' },
      ],
    },
    {
      name: 'closingTitle',
      label: 'Nadpis výzvy na konci stránky',
      type: 'text',
      defaultValue: 'Pojďme se na váš web podívat spolu',
    },
    {
      name: 'closingText',
      label: 'Text výzvy',
      type: 'textarea',
      defaultValue:
        'Úvodní konzultace trvá 30 minut a je zdarma. Řeknete mi, co děláte a co od webu chcete, já vám řeknu, co to bude stát a kdy to bude hotové.',
    },
  ],
}
