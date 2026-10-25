import type { Metadata } from 'next'
import Link from 'next/link'

import { BookingWidget, type MeetingTypeOption } from '@/components/forms/BookingWidget'
import { PageHeader } from '@/components/PageHeader'
import { getBookingSettings, getSiteSettings } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Rezervace konzultace zdarma',
  description: 'Vyberte si termín 30minutové konzultace zdarma. Online, telefonicky nebo osobně.',
  path: '/rezervace',
})

type Props = { searchParams: Promise<{ balicek?: string }> }

export default async function BookingPage({ searchParams }: Props) {
  const [settings, site, params] = await Promise.all([getBookingSettings(), getSiteSettings(), searchParams])
  const types = (settings.meetingTypes ?? []).map((t) => ({
    label: t.label,
    kind: t.kind,
    durationMin: t.durationMin,
    description: t.description,
  })) as MeetingTypeOption[]
  const pkg = params.balicek?.slice(0, 80)

  return (
    <>
      <PageHeader
        title="Rezervace konzultace"
        intro="Konzultace je zdarma a k ničemu vás nezavazuje. Probereme, co děláte, co od webu čekáte a kolik to bude stát."
        crumbs={[{ name: 'Rezervace', path: '/rezervace' }]}
      />
      <div className="container-site mt-14 grid gap-16 lg:grid-cols-[1fr_18rem]">
        <div className="max-w-3xl">
          {settings.enabled && types.length ? (
            <BookingWidget
              types={types}
              privacyHref="/ochrana-osobnich-udaju"
              initialMessage={pkg ? `Zajímá mě balíček ${pkg}.` : undefined}
            />
          ) : (
            <p className="ui border-l-4 border-tape bg-surface p-5">
              Online rezervace jsou teď vypnuté. Napište mi přes <Link href="/kontakt">kontaktní formulář</Link>
              {site.phone ? ` nebo zavolejte na ${site.phone}` : ''}.
            </p>
          )}
        </div>
        <aside className="ui space-y-6 text-[0.975rem] lg:border-l lg:border-line lg:pl-8">
          <div>
            <h2 className="text-[1.1rem]">Co si připravit</h2>
            <ul className="mt-3 list-[square] space-y-1.5 pl-5 text-pencil">
              <li>Čím se zabýváte a pro koho</li>
              <li>Weby, které se vám líbí</li>
              <li>Odkaz na současný web nebo profil</li>
              <li>Představu o termínu a rozpočtu</li>
            </ul>
          </div>
          <div>
            <h2 className="text-[1.1rem]">Raději napsat?</h2>
            <p className="mt-2 text-pencil">
              <a href={`mailto:${site.email}`}>{site.email}</a>
              {site.phone && (
                <>
                  <br />
                  <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
                </>
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
