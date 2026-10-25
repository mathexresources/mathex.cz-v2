import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { serviceData } from '../seed/content'
import {
  ABOUT,
  GENERAL_WEB_POST,
  HOME,
  LECTURE_FAQS,
  LECTURE_SERVICE,
  LEGACY,
  LEGACY_NICHE_FAQS,
  SECURITY_CATEGORY,
  SECURITY_POST,
  SITE,
  USER_BIO,
  WEB_SECURITY_FAQ,
  WEB_SERVICE,
} from '../seed/defaults'

/**
 * Přepne běžící web na širší zaměření (weby na míru + přednášky o bezpečnosti).
 * Mění jen obsah, který je pořád stejný jako původní výchozí text – co jsi
 * v administraci upravil, zůstane. Na prázdné databázi nedělá nic (pak proběhne seed).
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const log = (msg: string) => payload.logger.info(`[migrace obsahu] ${msg}`)
  // Záměrně bez transakce migrace: každá změna se uloží samostatně, takže případná
  // chyba nezablokuje start webu (migrace je opakovatelná – kontroluje, co už existuje).
  const opts = { depth: 0, overrideAccess: true } as const

  const services = await payload.count({ collection: 'services', ...opts })
  if (services.totalDocs === 0) return

  try {
    // ---------- Texty ----------
    const site = await payload.findGlobal({ slug: 'site-settings', ...opts })
    const siteData: Record<string, string> = {}
    if (site.tagline === LEGACY.tagline) siteData.tagline = SITE.tagline
    if (site.defaultDescription === LEGACY.defaultDescription) siteData.defaultDescription = SITE.defaultDescription
    if (Object.keys(siteData).length) {
      await payload.updateGlobal({ slug: 'site-settings', data: siteData, ...opts })
      log('Nastavení webu: nový slogan a popis')
    }

    const home = await payload.findGlobal({ slug: 'home-page', ...opts })
    const homeData: Record<string, string> = {}
    if (home.heroTitle === LEGACY.heroTitle) homeData.heroTitle = HOME.heroTitle
    if (home.heroText === LEGACY.heroText) homeData.heroText = HOME.heroText
    if (home.closingTitle === LEGACY.closingTitle) homeData.closingTitle = HOME.closingTitle
    if (home.closingText === LEGACY.closingText) homeData.closingText = HOME.closingText
    if (Object.keys(homeData).length) {
      await payload.updateGlobal({ slug: 'home-page', data: homeData, ...opts })
      log('Úvodní stránka: nové texty')
    }

    const about = await payload.findGlobal({ slug: 'about-page', ...opts })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstText = (about.body as any)?.root?.children?.[0]?.children?.[0]?.text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aboutData: Record<string, any> = {}
    if (about.headline === LEGACY.aboutHeadline) aboutData.headline = ABOUT.headline
    if (firstText === LEGACY.aboutBodyStart) aboutData.body = ABOUT.body()
    if (Object.keys(aboutData).length) {
      await payload.updateGlobal({ slug: 'about-page', data: aboutData, ...opts })
      log('O mně: nové texty')
    }

    const users = await payload.find({ collection: 'users', where: { bio: { equals: LEGACY.userBio } }, ...opts })
    for (const u of users.docs) await payload.update({ collection: 'users', id: u.id, data: { bio: USER_BIO }, ...opts })

    // ---------- FAQ ----------
    for (const f of LEGACY_NICHE_FAQS) {
      await payload.delete({
        collection: 'faqs',
        where: { and: [{ question: { equals: f.question } }, { answer: { equals: f.answer } }] },
        ...opts,
      })
    }
    const faqId = async (question: string) =>
      (await payload.find({ collection: 'faqs', where: { question: { equals: question } }, limit: 1, ...opts })).docs[0]?.id
    const maxOrder = (await payload.find({ collection: 'faqs', sort: '-order', limit: 1, ...opts })).docs[0]?.order ?? 0
    for (const [i, f] of [WEB_SECURITY_FAQ, ...LECTURE_FAQS].entries()) {
      if (!(await faqId(f.question))) {
        await payload.create({ collection: 'faqs', data: { ...f, order: maxOrder + 1 + i, showOnFaqPage: true }, ...opts })
      }
    }
    const faqIds = async (questions: string[]) =>
      (await Promise.all(questions.map(faqId))).filter((id): id is number => typeof id === 'number')

    // ---------- Služby ----------
    const bySlug = async (slug: string) =>
      (await payload.find({ collection: 'services', where: { slug: { equals: slug } }, limit: 1, ...opts })).docs[0]

    let webService = await bySlug(WEB_SERVICE.slug)
    if (!webService) {
      webService = await payload.create({
        collection: 'services',
        data: { ...serviceData(WEB_SERVICE), faqs: await faqIds(WEB_SERVICE.faqQuestions) },
        ...opts,
      })
      log('Přidaná služba Weby na míru')
    }
    if (!(await bySlug(LECTURE_SERVICE.slug))) {
      await payload.create({
        collection: 'services',
        data: {
          ...serviceData(LECTURE_SERVICE),
          body: LECTURE_SERVICE.body(),
          faqs: await faqIds(LECTURE_SERVICE.faqQuestions),
        },
        ...opts,
      })
      log('Přidaná služba Přednášky o bezpečnosti')
    }

    // ---------- Blog ----------
    const legacyServiceIds: number[] = []
    for (const slug of Object.keys(LEGACY.services)) {
      const s = await bySlug(slug)
      if (s) legacyServiceIds.push(s.id)
    }
    if (legacyServiceIds.length) {
      const related = await payload.find({
        collection: 'posts',
        where: { relatedService: { in: legacyServiceIds } },
        limit: 100,
        ...opts,
      })
      for (const p of related.docs) {
        await payload.update({ collection: 'posts', id: p.id, data: { relatedService: webService.id }, ...opts })
      }
    }

    const craft = (
      await payload.find({ collection: 'posts', where: { slug: { equals: LEGACY.craftPost.slug } }, limit: 1, ...opts })
    ).docs[0]
    const generalExists = (
      await payload.count({ collection: 'posts', where: { slug: { equals: GENERAL_WEB_POST.slug } }, ...opts })
    ).totalDocs
    if (craft && craft.title === LEGACY.craftPost.title && !generalExists) {
      await payload.update({
        collection: 'posts',
        id: craft.id,
        data: {
          title: GENERAL_WEB_POST.title,
          slug: GENERAL_WEB_POST.slug,
          excerpt: GENERAL_WEB_POST.excerpt,
          content: GENERAL_WEB_POST.content(),
          relatedService: webService.id,
        },
        ...opts,
      })
      log('Článek pro řemeslníky přepsán na obecný')
    }

    let category = (
      await payload.find({ collection: 'categories', where: { slug: { equals: SECURITY_CATEGORY.slug } }, limit: 1, ...opts })
    ).docs[0]
    if (!category) category = await payload.create({ collection: 'categories', data: SECURITY_CATEGORY, ...opts })

    const securityExists = (
      await payload.count({ collection: 'posts', where: { slug: { equals: SECURITY_POST.slug } }, ...opts })
    ).totalDocs
    if (!securityExists) {
      const author = (await payload.find({ collection: 'users', limit: 1, ...opts })).docs[0]
      await payload.create({
        collection: 'posts',
        data: {
          title: SECURITY_POST.title,
          slug: SECURITY_POST.slug,
          excerpt: SECURITY_POST.excerpt,
          category: category.id,
          author: author?.id,
          _status: 'published',
          publishedAt: new Date().toISOString(),
          content: SECURITY_POST.content(),
        },
        ...opts,
      })
      log('Přidaný článek o podvodných e-mailech')
    }

    // ---------- Oborové služby pryč (jen neupravené) ----------
    for (const [slug, headline] of Object.entries(LEGACY.services)) {
      const s = await bySlug(slug)
      if (s && s.headline === headline) {
        await payload.delete({ collection: 'services', id: s.id, ...opts })
        log(`Odstraněná oborová služba ${slug}`)
      }
    }
  } catch (err) {
    // Obsah není kritický – web musí naběhnout i tak.
    payload.logger.error({ err }, '[migrace obsahu] Nepodařilo se aktualizovat texty, zůstávají původní.')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Obsahová migrace – zpět se nevrací (texty si případně uprav v administraci).
}
