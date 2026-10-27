import Link from 'next/link'

export function Section({
  id,
  title,
  intro,
  link,
  children,
}: {
  id: string
  title: string
  intro?: string
  link?: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="container-site mt-24 sm:mt-28">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id={`${id}-title`} className="max-w-[22ch]">
            {title}
          </h2>
          {intro && <p className="mt-4 max-w-[58ch] text-pencil">{intro}</p>}
        </div>
        {link && (
          <Link href={link.href} className="ui flex-none text-[1rem] font-semibold decoration-tape decoration-2">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
