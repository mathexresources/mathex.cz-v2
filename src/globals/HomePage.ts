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
      defaultValue: 'Rychlé a bezpečné weby na míru. A přednášky o tom, jak se na internetu nenechat napálit.',
    },
    {
      name: 'heroText',
      label: 'Text pod nadpisem',
      type: 'textarea',
      required: true,
      defaultValue:
        'Navrhnu a naprogramuju web pro vaši firmu, projekt nebo organizaci – bez šablon, s pevnou cenou a hotový v řádu týdnů.',
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
      defaultValue: 'Pojďme to probrat',
    },
    {
      name: 'closingText',
      label: 'Text výzvy',
      type: 'textarea',
      defaultValue:
        'Úvodní konzultace trvá 30 minut a je zdarma. Řeknu vám, co to obnáší, kolik to stojí a kdy to stihneme.',
    },
  ],
}
