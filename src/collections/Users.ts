import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Uživatel', plural: 'Uživatelé' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email'],
    group: 'Nastavení',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
  },
  fields: [
    { name: 'name', label: 'Jméno', type: 'text', required: true },
    {
      name: 'bio',
      label: 'Krátké bio (zobrazí se u článků)',
      type: 'textarea',
    },
    { name: 'photo', label: 'Fotka', type: 'upload', relationTo: 'media' },
  ],
}
