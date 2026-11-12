import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { HOME, HOME_POSTER, LECTURE_HEADLINE_PREV, LECTURE_SERVICE } from '../seed/defaults'

/**
 * Úvodní stránka je jen o webech, přednášky mají vlastní stránku /prednasky.
 * Mění jen texty, které jsou pořád výchozí – úpravy z administrace zůstanou.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const opts = { depth: 0, overrideAccess: true } as const
  try {
    const home = await payload.findGlobal({ slug: 'home-page', ...opts })
    const data: Record<string, string> = {}
    if (home.heroTitle === HOME_POSTER.heroTitle) data.heroTitle = HOME.heroTitle
    if (home.heroText === HOME_POSTER.heroText) data.heroText = HOME.heroText
    if (home.closingText === HOME_POSTER.closingText) data.closingText = HOME.closingText
    if (Object.keys(data).length) {
      await payload.updateGlobal({ slug: 'home-page', data, ...opts })
      payload.logger.info('[migrace obsahu] Úvodní stránka: texty jen o webech')
    }

    const lectures = await payload.find({
      collection: 'services',
      where: { and: [{ slug: { equals: LECTURE_SERVICE.slug } }, { headline: { equals: LECTURE_HEADLINE_PREV } }] },
      limit: 1,
      ...opts,
    })
    for (const s of lectures.docs) {
      await payload.update({ collection: 'services', id: s.id, data: { headline: LECTURE_SERVICE.headline }, ...opts })
      payload.logger.info('[migrace obsahu] Přednášky: nový nadpis')
    }
  } catch (err) {
    payload.logger.error({ err }, '[migrace obsahu] Texty se nepodařilo změnit, zůstávají původní.')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {}
