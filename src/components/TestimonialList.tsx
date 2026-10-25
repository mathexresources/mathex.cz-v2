import type { Testimonial } from '@/payload-types'

export function TestimonialList({ items }: { items: Testimonial[] }) {
  if (!items.length) return null
  const [first, ...rest] = items
  return (
    <div className="grid gap-10 md:grid-cols-[1.3fr_1fr]">
      <Quote item={first} large />
      {rest.length > 0 && (
        <div className="space-y-10 md:border-l md:border-line md:pl-10">
          {rest.slice(0, 2).map((t) => (
            <Quote key={t.id} item={t} />
          ))}
        </div>
      )}
    </div>
  )
}

function Quote({ item, large }: { item: Testimonial; large?: boolean }) {
  return (
    <figure>
      <blockquote className={large ? 'text-[1.5rem] leading-snug sm:text-[1.75rem]' : 'text-[1.15rem]'}>
        <p>„{item.quote}“</p>
      </blockquote>
      <figcaption className="ui mt-4 text-[0.95rem]">
        <span className="font-semibold">{item.name}</span>
        {item.company && <span className="text-pencil">, {item.company}</span>}
        {item.source && (
          <>
            {' '}
            <a href={item.source} rel="noopener" target="_blank" className="text-pencil">
              (původní recenze)
            </a>
          </>
        )}
      </figcaption>
    </figure>
  )
}
