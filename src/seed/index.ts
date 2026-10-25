/**
 * Ruční naplnění databáze:  ADMIN_EMAIL=ty@domena.cz ADMIN_PASSWORD=... npm run seed
 *
 * Obvykle to není potřeba – výchozí obsah se nahraje sám při prvním startu webu
 * a účet administrátora si založíš na /admin.
 */
import { randomBytes } from 'crypto'

import config from '@payload-config'
import { getPayload } from 'payload'

import { seedIfEmpty } from './content'
import { USER_BIO } from './defaults'

const payload = await getPayload({ config })

const users = await payload.count({ collection: 'users' })
if (users.totalDocs === 0) {
  const email = process.env.ADMIN_EMAIL || 'admin@mathex.cz'
  const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url')
  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name: process.env.ADMIN_NAME || 'Jméno Příjmení',
      bio: USER_BIO,
    },
  })
  payload.logger.info(
    `[seed] Vytvořen administrátor ${email}${process.env.ADMIN_PASSWORD ? '' : ` s heslem: ${password}  (hned ho změň)`}`,
  )
}

if (!(await seedIfEmpty(payload))) payload.logger.info('[seed] Obsah už existuje, přeskakuji.')
process.exit(0)
