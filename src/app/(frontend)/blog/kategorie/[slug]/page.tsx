import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CategoryNav } from '@/components/CategoryNav'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { PostList } from '@/components/PostList'
import { getCategories, getCategoryBySlug, getPosts } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ strana?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return buildMetadata({
    title: `${category.title} – blog`,
    description: category.description,
    path: `/blog/kategorie/${category.slug}`,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { strana }] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()
  const page = Math.max(1, Number.parseInt(strana ?? '1', 10) || 1)
  const [result, categories] = await Promise.all([getPosts({ page, categoryId: category.id }), getCategories()])

  return (
    <>
      <PageHeader
        title={category.title}
        intro={category.description}
        crumbs={[
          { name: 'Blog', path: '/blog' },
          { name: category.title, path: `/blog/kategorie/${category.slug}` },
        ]}
      >
        <CategoryNav categories={categories} active={category.slug} />
      </PageHeader>
      <div className="container-site mt-12">
        <PostList posts={result.docs} />
        <Pagination page={page} totalPages={result.totalPages} basePath={`/blog/kategorie/${category.slug}`} />
      </div>
    </>
  )
}
