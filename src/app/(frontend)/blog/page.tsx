import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CategoryNav } from '@/components/CategoryNav'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { PostList } from '@/components/PostList'
import { getCategories, getPosts } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<{ strana?: string }> }

const pageNumber = (v?: string) => Math.max(1, Number.parseInt(v ?? '1', 10) || 1)

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageNumber((await searchParams).strana)
  return buildMetadata({
    title: page > 1 ? `Blog – strana ${page}` : 'Blog o webech a bezpečnosti na internetu',
    description:
      'Srozumitelně o webech a bezpečnosti na internetu: kolik stojí web, jak ho najdou lidé na Googlu a jak poznat podvodný e-mail.',
    path: page > 1 ? `/blog?strana=${page}` : '/blog',
  })
}

export default async function BlogPage({ searchParams }: Props) {
  const page = pageNumber((await searchParams).strana)
  const [result, categories] = await Promise.all([getPosts({ page }), getCategories()])
  if (page > 1 && page > result.totalPages) notFound()

  return (
    <>
      <PageHeader
        title="Blog"
        intro="O webech a bezpečnosti na internetu – pro lidi, ne pro programátory. Bez žargonu a se skutečnými příklady."
        crumbs={[{ name: 'Blog', path: '/blog' }]}
      >
        <CategoryNav categories={categories} />
      </PageHeader>
      <div className="container-site mt-12">
        <PostList posts={result.docs} />
        <Pagination page={page} totalPages={result.totalPages} basePath="/blog" />
      </div>
    </>
  )
}
