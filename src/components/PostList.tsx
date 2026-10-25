import Link from 'next/link'

import { pluralMinutes, readingMinutes } from '@/lib/format'
import { formatFullDate } from '@/lib/time'
import type { Category, Post } from '@/payload-types'

export function PostList({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return <p className="ui text-pencil">Zatím tu nejsou žádné články. První je na cestě.</p>
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {posts.map((post) => {
        const category = post.category && typeof post.category === 'object' ? (post.category as Category) : null
        const minutes = readingMinutes(post.content)
        return (
          <li key={post.id} className="relative grid gap-2 py-7 md:grid-cols-[11rem_1fr] md:gap-10">
            <p className="ui text-[0.9rem] text-pencil">
              {post.publishedAt && <time dateTime={post.publishedAt}>{formatFullDate(post.publishedAt)}</time>}
              <span className="block">
                {minutes} {pluralMinutes(minutes)} čtení
              </span>
            </p>
            <div className="max-w-[62ch]">
              {category && <p className="ui text-[0.9rem] text-pencil">{category.title}</p>}
              <h3 className="text-[1.5rem] leading-tight">
                <Link
                  href={`/blog/${post.slug}`}
                  className="no-underline after:absolute after:inset-0 hover:underline hover:decoration-tape hover:decoration-2"
                >
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 text-pencil">{post.excerpt}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
