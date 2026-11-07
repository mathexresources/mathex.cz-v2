import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { HOME, HOME_PREV } from '../seed/defaults'

/**
 * Nový vzhled úvodu: kratší slogan s oranžovou částí (*hvězdičky*).
 * Mění jen texty, které jsou pořád výchozí – co je upravené v administraci, zůstane.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  try {
    const home = await payload.findGlobal({ slug: 'home-page', depth: 0, overrideAccess: true })
    const data: Record<string, string> = {}
    if (home.heroTitle === HOME_PREV.heroTitle) data.heroTitle = HOME.heroTitle
    if (home.heroText === HOME_PREV.heroText) data.heroText = HOME.heroText
    if (Object.keys(data).length) {
      await payload.updateGlobal({ slug: 'home-page', data, depth: 0, overrideAccess: true })
      payload.logger.info('[migrace obsahu] Úvodní stránka: nový slogan')
    }
  } catch (err) {
    payload.logger.error({ err }, '[migrace obsahu] Slogan se nepodařilo změnit, zůstává původní.')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {}
