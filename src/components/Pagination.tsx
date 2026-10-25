import Link from 'next/link'

export function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?strana=${p}`)
  return (
    <nav aria-label="Stránkování" className="ui mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className="btn btn-secondary">
          Novější články
        </Link>
      ) : (
        <span />
      )}
      <span className="text-pencil">
        Strana {page} z {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className="btn btn-secondary">
          Starší články
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
