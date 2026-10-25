import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'

import { CMS_CACHE_TAG } from './cache-tag'
import { getPayloadClient } from './payload'

/**
 * Všechna data pro web jdou přes cache. Při změně v administraci
 * ji hook `revalidate` zneplatní, takže web je rychlý a přitom vždy aktuální.
 */
const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { tags: [CMS_CACHE_TAG], revalidate: 3600 })

export const getSiteSettings = cached(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
}, 'site-settings')

export const getHomePage = cached(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'home-page', depth: 1 })
}, 'home-page')

export const getAboutPage = cached(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'about-page', depth: 1 })
}, 'about-page')

export const getBookingSettings = cached(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'booking-settings', depth: 0 })
}, 'booking-settings')

export const getServices = cached(async () => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'services', sort: 'order', limit: 50, depth: 0 })
  return res.docs
}, 'services')

export const getServiceBySlug = cached(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'services',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}, 'service-by-slug')

export const getProjects = cached(async (opts: { featured?: boolean; segment?: string } = {}) => {
  const payload = await getPayloadClient()
  const and: Where[] = []
  if (opts.featured) and.push({ featured: { equals: true } })
  if (opts.segment) and.push({ segment: { equals: opts.segment } })
  const res = await payload.find({
    collection: 'projects',
    where: and.length ? { and } : undefined,
    sort: 'order',
    limit: 50,
    depth: 1,
  })
  return res.docs
}, 'projects')

export const getProjectBySlug = cached(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}, 'project-by-slug')

export const getPackages = cached(async (category: 'web' | 'prednasky' = 'web') => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'packages',
    where: category === 'web' ? { or: [{ category: { equals: 'web' } }, { category: { exists: false } }] } : { category: { equals: category } },
    sort: 'order',
    limit: 20,
    depth: 0,
  })
  return res.docs
}, 'packages')

export const getTestimonials = cached(async (limit: number = 6) => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'testimonials', limit, depth: 1, sort: '-createdAt' })
  return res.docs
}, 'testimonials')

export const getFaqs = cached(async (opts: { onlyFaqPage?: boolean; limit?: number } = {}) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'faqs',
    where: opts.onlyFaqPage ? { showOnFaqPage: { equals: true } } : undefined,
    sort: 'order',
    limit: opts.limit ?? 100,
    depth: 0,
  })
  return res.docs
}, 'faqs')

export const POSTS_PER_PAGE = 9

export const getPosts = cached(
  async (opts: { page?: number; categoryId?: number | string; limit?: number; exclude?: number | string } = {}) => {
    const payload = await getPayloadClient()
    const and: Where[] = [{ _status: { equals: 'published' } }]
    if (opts.categoryId) and.push({ category: { equals: opts.categoryId } })
    if (opts.exclude) and.push({ id: { not_equals: opts.exclude } })
    return payload.find({
      collection: 'posts',
      where: { and },
      sort: '-publishedAt',
      limit: opts.limit ?? POSTS_PER_PAGE,
      page: opts.page ?? 1,
      depth: 1,
      overrideAccess: false,
    })
  },
  'posts',
)

export const getPostBySlug = cached(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}, 'post-by-slug')

export const getCategories = cached(async () => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'categories', limit: 50, sort: 'title', depth: 0 })
  return res.docs
}, 'categories')

export const getCategoryBySlug = cached(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return res.docs[0] ?? null
}, 'category-by-slug')

export const getPages = cached(async () => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 50,
    depth: 0,
    overrideAccess: false,
    select: { title: true, slug: true, showInFooter: true, updatedAt: true },
  })
  return res.docs
}, 'pages')

export const getPageBySlug = cached(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}, 'page-by-slug')

/** Data pro sitemapu – jen slugy a data úprav. */
export const getSitemapEntries = cached(async () => {
  const payload = await getPayloadClient()
  const pick = { slug: true, updatedAt: true } as const
  const [posts, services, projects, pages, categories] = await Promise.all([
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: 1000, depth: 0, select: pick, overrideAccess: false }),
    payload.find({ collection: 'services', limit: 100, depth: 0, select: pick }),
    payload.find({ collection: 'projects', limit: 200, depth: 0, select: pick }),
    payload.find({ collection: 'pages', where: { _status: { equals: 'published' } }, limit: 100, depth: 0, select: pick, overrideAccess: false }),
    payload.find({ collection: 'categories', limit: 100, depth: 0, select: pick }),
  ])
  return {
    posts: posts.docs,
    services: services.docs,
    projects: projects.docs,
    pages: pages.docs,
    categories: categories.docs,
  }
}, 'sitemap')
