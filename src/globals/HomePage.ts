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
      defaultValue: 'Weby, které *nezdržují.* A lidi, které nenapálí.',
      admin: { description: 'Text mezi hvězdičkami se zobrazí oranžově, např. Weby, které *nezdržují.*' },
    },
    {
      name: 'heroText',
      label: 'Text pod nadpisem',
      type: 'textarea',
      required: true,
      defaultValue:
        'Navrhnu a naprogramuju rychlý a bezpečný web na míru. Na přednáškách ukazuji, jak fungují phishingové útoky a co o vás prozradí internet.',
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
