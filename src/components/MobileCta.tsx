import Link from 'next/link'

/** Lepicí lišta na mobilu: zavolat nebo rezervovat jedním palcem. */
export function MobileCta({ phone }: { phone?: string | null }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 p-2 backdrop-blur sm:hidden">
      <div className="flex gap-2">
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="btn btn-secondary flex-1" data-umami-event="tel-mobile">
            Zavolat
          </a>
        )}
        <Link href="/rezervace" className="btn btn-primary flex-[1.6]">
          Rezervovat konzultaci
        </Link>
      </div>
    </div>
  )
}
