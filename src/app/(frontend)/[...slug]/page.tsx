import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/PageHeader'
import { RichText } from '@/components/RichText'
import { getPageBySlug } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'
import { formatFullDate } from '@/lib/time'

/** Textové stránky z administrace (zásady ochrany údajů, cookies, podmínky…). Ostatní adresy vrací 404. */
type Props = { params: Promise<{ slug: string[] }> }

async function load(params: Props['params']) {
  const { slug } = await params
  if (slug.length !== 1) return null
  return getPageBySlug(slug[0])
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params)
  if (!page) return { title: 'Stránka nenalezena', robots: { index: false } }
  return buildMetadata({
    title: page.title,
    description: page.intro,
    path: `/${page.slug}`,
    meta: page.meta,
  })
}

export default async function CmsPage({ params }: Props) {
  const page = await load(params)
  if (!page) notFound()
  return (
    <>
      <PageHeader title={page.title} intro={page.intro} crumbs={[{ name: page.title, path: `/${page.slug}` }]} />
      <div className="container-site mt-12">
        <RichText data={page.content} />
        <p className="ui mt-12 text-[0.9rem] text-pencil">
          Naposledy upraveno {formatFullDate(page.updatedAt)}.
        </p>
      </div>
    </>
  )
}
