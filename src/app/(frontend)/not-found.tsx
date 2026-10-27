import Link from 'next/link'

export const metadata = { title: 'Stránka nenalezena', robots: { index: false } }

export default function NotFound() {
  return (
    <section className="hatch border-b border-line">
      <div className="container-site py-20 sm:py-28">
        <p className="ui text-[clamp(5rem,18vw,12rem)] font-bold leading-none tracking-[-0.05em] text-accent [-webkit-text-stroke:2px_var(--color-ink)]">
          404
        </p>
        <h1 className="mt-6 max-w-[18ch]">Tahle stránka na výkresu chybí</h1>
        <p className="mt-5 max-w-[52ch] text-[1.2rem] text-pencil">
          Odkaz je možná starý nebo v něm je překlep. Zkuste začít od úvodní stránky.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            Na úvodní stránku
          </Link>
          <Link href="/kontakt" className="btn btn-secondary">
            Napsat mi
          </Link>
        </div>
      </div>
    </section>
  )
}
