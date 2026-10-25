import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { CMS_CACHE_TAG } from '@/lib/cache-tag'

/**
 * Po změně obsahu v administraci zneplatní cache webu,
 * takže se úpravy na webu projeví okamžitě.
 */
async function revalidate() {
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(CMS_CACHE_TAG)
  } catch {
    // Mimo Next.js (např. při seedování) cache neexistuje – nic se neděje.
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidate()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidate()
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = async ({ doc }) => {
  await revalidate()
  return doc
}

export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
}
