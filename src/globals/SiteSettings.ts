import type { GlobalConfig } from 'payload'

import { anyone, isLoggedIn } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Nastavení webu',
  admin: { group: 'Nastavení' },
  access: { read: anyone, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Značka',
          fields: [
            { name: 'brandName', label: 'Název značky', type: 'text', required: true, defaultValue: 'Mathex' },
            {
              name: 'tagline',
              label: 'Podtitul (do titulku stránek)',
              type: 'text',
              defaultValue: 'Weby na míru pro řemeslníky, restaurace a malé firmy',
            },
            {
              name: 'defaultDescription',
              label: 'Výchozí meta popis',
              type: 'textarea',
              maxLength: 170,
            },
            {
              name: 'defaultOgImage',
              label: 'Výchozí obrázek pro sdílení',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Když nevyplníš, vygeneruje se automaticky.' },
            },
          ],
        },
        {
          label: 'Firemní údaje',
          description: 'Tyto údaje musí být na webu podnikatele uvedené (patička).',
          fields: [
            { name: 'ownerName', label: 'Jméno podnikatele', type: 'text', required: true, defaultValue: 'Jméno Příjmení' },
            { name: 'ico', label: 'IČO', type: 'text', required: true, defaultValue: '00000000' },
            {
              name: 'vatPayer',
              label: 'Jsem plátce DPH',
              type: 'checkbox',
              defaultValue: false,
            },
            { name: 'dic', label: 'DIČ', type: 'text', admin: { condition: (data) => Boolean(data?.vatPayer) } },
            {
              type: 'row',
              fields: [
                { name: 'street', label: 'Ulice a číslo', type: 'text' },
                { name: 'city', label: 'Město', type: 'text', defaultValue: 'Praha' },
                { name: 'zip', label: 'PSČ', type: 'text' },
              ],
            },
            {
              name: 'registry',
              label: 'Zápis v rejstříku',
              type: 'text',
              defaultValue: 'Fyzická osoba zapsaná v živnostenském rejstříku.',
            },
          ],
        },
        {
          label: 'Kontakt',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'email', label: 'E-mail', type: 'email', required: true, defaultValue: 'ahoj@mathex.cz' },
                { name: 'phone', label: 'Telefon', type: 'text', defaultValue: '+420 000 000 000' },
              ],
            },
            {
              name: 'serviceArea',
              label: 'Oblast působnosti',
              type: 'text',
              defaultValue: 'Praha a okolí, online celá ČR',
            },
            {
              name: 'geo',
              label: 'Souřadnice (pro Google)',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'lat', label: 'Zeměpisná šířka', type: 'number' },
                    { name: 'lng', label: 'Zeměpisná délka', type: 'number' },
                  ],
                },
              ],
            },
            {
              name: 'socials',
              label: 'Sociální sítě a profily',
              type: 'array',
              admin: { description: 'Google Business, Firmy.cz, LinkedIn, Instagram, GitHub…' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: 'Název', type: 'text', required: true },
                    { name: 'url', label: 'URL', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
