import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CmsImage } from '@/components/CmsImage'
import { JsonLd } from '@/components/JsonLd'
import { PostList } from '@/components/PostList'
import { RichText } from '@/components/RichText'
import { getPostBySlug, getPosts, getSiteSettings } from '@/lib/data'
import { pluralMinutes, readingMinutes } from '@/lib/format'
import { articleSchema } from '@/lib/schema'
import { buildMetadata } from '@/lib/seo'
import { formatFullDate } from '@/lib/time'
import type { Category, Service, User } from '@/payload-types'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    meta: post.meta,
    image: post.cover,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  })
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const category = post.category && typeof post.category === 'object' ? (post.category as Category) : null
  const author = post.author && typeof post.author === 'object' ? (post.author as User) : null
  const service =
    post.relatedService && typeof post.relatedService === 'object' ? (post.relatedService as Service) : null
  const isSecurity = category?.slug === 'bezpecnost' || service?.segment === 'bezpecnost'
  const [related, site] = await Promise.all([
    getPosts({ limit: 3, categoryId: category?.id, exclude: post.id }),
    getSiteSettings(),
  ])
  const minutes = readingMinutes(post.content)
  const updated =
    post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 7 * 86400000

  return (
    <article>
      <header className="container-site pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: 'Blog', path: '/blog' },
            ...(category ? [{ name: category.title, path: `/blog/kategorie/${category.slug}` }] : []),
            { name: post.title, path: `/blog/${post.slug}` },
          ]}
        />
        <h1 className="mt-6 max-w-[22ch]">{post.title}</h1>
        <p className="mt-5 max-w-[60ch] text-[1.25rem] text-pencil">{post.excerpt}</p>
        <p className="ui mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem] text-pencil">
          <span>{author?.name ?? site.ownerName}</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{formatFullDate(post.publishedAt)}</time>
          )}
          {updated && (
            <span>
              aktualizováno <time dateTime={post.updatedAt}>{formatFullDate(post.updatedAt)}</time>
            </span>
          )}
          <span>
            {minutes} {pluralMinutes(minutes)} čtení
          </span>
        </p>
      </header>

      {post.cover && typeof post.cover === 'object' && (
        <div className="container-site mt-10">
          <CmsImage
            media={post.cover}
            sizes="(min-width: 1200px) 1184px, 100vw"
            priority
            className="aspect-[2/1] h-auto w-full border border-line object-cover"
          />
        </div>
      )}

      <div className="container-site mt-12">
        <RichText data={post.content} className="text-[1.15rem]" />

        <aside className="mt-16 max-w-[68ch] border-t-2 border-ink pt-6">
          <p className="ui font-semibold">{author?.name ?? site.ownerName}</p>
          <p className="mt-1 text-pencil">
            {author?.bio ?? 'Navrhuji a programuji weby na míru a přednáším o bezpečnosti na internetu.'}{' '}
            <Link href="/o-mne">Více o mně</Link>
          </p>
        </aside>

        {isSecurity ? (
          <div className="mt-12 max-w-[68ch] rounded-[3px] bg-ink p-6 text-paper sm:p-8">
            <p className="text-[1.35rem] font-bold">Chcete to probrat s vašimi lidmi?</p>
            <p className="mt-2 opacity-85">
              Na přednášce ukážu phishing a OSINT na skutečných příkladech – pro firmu, školu i veřejnost.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/kontakt?tema=prednaska" className="btn border-paper bg-paper text-ink hover:border-accent hover:bg-accent hover:text-on-accent">
                Domluvit přednášku
              </Link>
              <Link href="/sluzby/prednasky-bezpecnost-na-internetu" className="btn border-paper text-paper hover:bg-paper hover:text-ink">
                O přednáškách
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-12 max-w-[68ch] rounded-[3px] bg-ink p-6 text-paper sm:p-8">
            <p className="text-[1.35rem] font-bold">
              {service ? `Potřebujete ${service.title.toLowerCase()}?` : 'Chcete web, který přivádí zákazníky?'}
            </p>
            <p className="mt-2 opacity-85">
              Na 30minutové konzultaci zdarma zjistíme, co váš web potřebuje a kolik to bude stát.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/rezervace" className="btn border-paper bg-paper text-ink hover:border-accent hover:bg-accent hover:text-on-accent">
                Vybrat termín
              </Link>
              {service && (
                <Link href={`/sluzby/${service.slug}`} className="btn border-paper text-paper hover:bg-paper hover:text-ink">
                  {service.title}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {related.docs.length > 0 && (
        <section className="container-site mt-24" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-8">
            Mohlo by vás zajímat
          </h2>
          <PostList posts={related.docs} />
        </section>
      )}

      <JsonLd data={articleSchema(post)} />
    </article>
  )
}
