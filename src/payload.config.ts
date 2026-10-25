import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cs } from '@payloadcms/translations/languages/cs'
import { en } from '@payloadcms/translations/languages/en'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Bookings } from './collections/Bookings'
import { Categories } from './collections/Categories'
import { Faqs } from './collections/Faqs'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { Packages } from './collections/Packages'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Services } from './collections/Services'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { diagnosticsEndpoint, testEmailEndpoint } from './endpoints/diagnostics'
import { AboutPage } from './globals/AboutPage'
import { BookingSettings } from './globals/BookingSettings'
import { HomePage } from './globals/HomePage'
import { SiteSettings } from './globals/SiteSettings'
import { env } from './lib/env'
import { migrations } from './migrations'
import { seedIfEmpty } from './seed/content'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = env.siteUrl

const urlFor = (collection: string | undefined, slug: string | undefined) => {
  if (!slug) return siteUrl
  switch (collection) {
    case 'posts':
      return `${siteUrl}/blog/${slug}`
    case 'services':
      return `${siteUrl}/sluzby/${slug}`
    case 'projects':
      return `${siteUrl}/portfolio/${slug}`
    default:
      return `${siteUrl}/${slug}`
  }
}

export default buildConfig({
  serverURL: siteUrl,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' – administrace',
    },
    importMap: { baseDir: path.resolve(dirname) },
    dateFormat: 'd. M. yyyy HH:mm',
    components: {
      // Panel „Kontrola služeb“ na nástěnce administrace
      beforeDashboard: ['@/components/admin/ServiceCheck#ServiceCheck'],
    },
  },
  endpoints: [diagnosticsEndpoint, testEmailEndpoint],
  i18n: {
    supportedLanguages: { cs, en },
    fallbackLanguage: 'cs',
  },
  collections: [
    Pages,
    Services,
    Projects,
    Packages,
    Testimonials,
    Faqs,
    Posts,
    Categories,
    Media,
    Bookings,
    Inquiries,
    Users,
  ],
  globals: [HomePage, AboutPage, SiteSettings, BookingSettings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    // V produkci se migrace spustí automaticky při startu aplikace.
    prodMigrations: migrations,
  }),
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'web@mathex.cz',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Mathex',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      })
    : undefined,
  sharp,
  // Při prvním startu s prázdnou databází nahraje výchozí obsah (vypnutí: SEED_ON_EMPTY=false)
  onInit: async (payload) => {
    if (process.env.SEED_ON_EMPTY === 'false') return
    try {
      await seedIfEmpty(payload)
    } catch (err) {
      payload.logger.error({ err }, '[seed] Výchozí obsah se nepodařilo nahrát')
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    disablePlaygroundInProduction: true,
  },
  plugins: [
    seoPlugin({
      collections: ['posts', 'services', 'projects', 'pages'],
      globals: ['home-page', 'about-page'],
      uploadsCollection: 'media',
      tabbedUI: false,
      generateTitle: ({ doc }) => (doc?.title ? String(doc.title) : ''),
      generateDescription: ({ doc }) =>
        String(doc?.excerpt || doc?.shortDescription || doc?.summary || doc?.intro || ''),
      generateURL: ({ doc, collectionSlug }) =>
        urlFor(collectionSlug, doc?.slug ? String(doc.slug) : undefined),
    }),
  ],
})
