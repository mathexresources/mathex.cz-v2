'use client'

import Link from 'next/link'
import { useActionState, useCallback, useEffect, useState, useTransition } from 'react'

import { createBooking, getAvailableSlots, type BookingState } from '@/actions/booking'
import type { DaySlots } from '@/lib/slots'

import { Consent, Field } from './Field'
import { FormGuard } from './FormGuard'

export type MeetingTypeOption = {
  label: string
  kind: string
  durationMin: number
  description?: string | null
}

const TZ = 'Europe/Prague'
const dayFmt = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' })
const dayLong = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
const fullFmt = new Intl.DateTimeFormat('cs-CZ', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
})

const keyToDate = (key: string) => new Date(`${key}T12:00:00Z`)

const initial: BookingState = { status: 'idle' }

export function BookingWidget({
  types,
  privacyHref,
  initialMessage,
  turnstileSiteKey,
}: {
  types: MeetingTypeOption[]
  privacyHref: string
  initialMessage?: string
  turnstileSiteKey?: string
}) {
  const [typeIndex, setTypeIndex] = useState(0)
  const [days, setDays] = useState<DaySlots[] | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [loading, startLoading] = useTransition()
  const [state, action, pending] = useActionState(createBooking, initial)

  const load = useCallback((index: number) => {
    startLoading(async () => {
      const result = await getAvailableSlots(index)
      setDays(result)
      setDay(result[0]?.date ?? null)
      setSlot(null)
    })
  }, [])

  useEffect(() => load(typeIndex), [typeIndex, load])

  // Když termín mezitím někdo obsadil, načíst sloty znovu
  useEffect(() => {
    if (state.errors?.slot && state.status === 'error') load(typeIndex)
  }, [state, typeIndex, load])

  const type = types[typeIndex]
  const v = state.values ?? {}

  if (state.status === 'success' && state.booked) {
    return (
      <div role="status" className="border border-ink bg-surface p-6 sm:p-8">
        <p className="ui text-[1.5rem] font-bold">Hotovo, máte zarezervováno</p>
        <p className="ui mt-3 text-[1.15rem]">{fullFmt.format(new Date(state.booked.start))}</p>
        <p className="ui text-pencil">{state.booked.type}</p>
        <p className="mt-5 text-pencil">
          Potvrzení s pozvánkou do kalendáře odešlo na <strong className="text-ink">{state.booked.email}</strong>.
          Pokud nedorazí do pár minut, mrkněte do spamu. Termín můžete zrušit odkazem v e-mailu.
        </p>
        <Link href="/" className="btn btn-secondary mt-6">
          Zpět na úvod
        </Link>
      </div>
    )
  }

  const currentDay = days?.find((d) => d.date === day)

  return (
    <form action={action} className="relative space-y-12" noValidate>
      {/* 1. Typ schůzky */}
      <fieldset>
        <legend className="ui text-[1.35rem] font-bold">Jak se chcete potkat</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {types.map((t, i) => (
            <label
              key={t.label}
              className="ui flex cursor-pointer gap-3 border border-line bg-surface p-4 has-[:checked]:border-ink has-[:checked]:outline has-[:checked]:outline-1 has-[:checked]:outline-ink"
            >
              <input
                type="radio"
                name="typeIndex"
                value={i}
                checked={typeIndex === i}
                onChange={() => setTypeIndex(i)}
                className="mt-1 h-4 w-4 accent-[var(--color-ink)]"
              />
              <span>
                <span className="block font-semibold">
                  {t.label} <span className="font-normal text-pencil">({t.durationMin} min)</span>
                </span>
                {t.description && <span className="mt-0.5 block text-[0.9rem] text-pencil">{t.description}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. Termín */}
      <fieldset aria-busy={loading}>
        <legend className="ui text-[1.35rem] font-bold">Vyberte termín</legend>
        <p className="field-hint mt-1">Časy jsou v českém čase.</p>

        {days === null || (loading && !days.length) ? (
          <p className="ui mt-4 text-pencil">Načítám volné termíny…</p>
        ) : days.length === 0 ? (
          <p className="ui mt-4 border-l-4 border-tape bg-surface p-4">
            V nejbližších dnech nemám volno. Napište mi prosím přes{' '}
            <Link href="/kontakt">kontaktní formulář</Link> a domluvíme se jinak.
          </p>
        ) : (
          <div className={loading ? 'opacity-50 transition-opacity' : undefined}>
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Den">
              {days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  aria-pressed={d.date === day}
                  onClick={() => {
                    setDay(d.date)
                    setSlot(null)
                  }}
                  className="ui flex min-w-[5.5rem] flex-col items-center rounded-md border border-line bg-surface px-3 py-2.5 text-[0.95rem] hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
                >
                  <span className="capitalize">{dayFmt.format(keyToDate(d.date))}</span>
                  <span className="text-[0.8rem] opacity-75">{d.slots.length} volných</span>
                </button>
              ))}
            </div>

            {currentDay && (
              <div className="mt-5">
                <p className="ui font-semibold first-letter:uppercase">{dayLong.format(keyToDate(currentDay.date))}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {currentDay.slots.map((s) => (
                    <label
                      key={s}
                      className="ui flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-[1rem] tabular-nums hover:border-ink has-[:checked]:border-tape has-[:checked]:bg-tape has-[:checked]:font-bold has-[:checked]:text-on-tape has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink"
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={s}
                        checked={slot === s}
                        onChange={() => setSlot(s)}
                        className="sr-only"
                      />
                      {timeFmt.format(new Date(s))}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {state.errors?.slot && <p className="field-error">{state.errors.slot}</p>}
      </fieldset>

      {/* 3. Údaje */}
      <fieldset className="space-y-5">
        <legend className="ui mb-4 text-[1.35rem] font-bold">Něco o vás</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Jméno" name="name" required autoComplete="name" defaultValue={v.name} error={state.errors?.name} />
          <Field label="E-mail" name="email" type="email" required autoComplete="email" inputMode="email" defaultValue={v.email} error={state.errors?.email} />
          <Field
            label="Telefon"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required={type?.kind === 'phone'}
            defaultValue={v.phone}
            error={state.errors?.phone}
          />
          <Field label="Firma" name="company" autoComplete="organization" defaultValue={v.company} />
          <Field label="Obor" name="field" placeholder="např. instalatér, bistro, kadeřnictví" defaultValue={v.field} />
          <Field label="Současný web" name="website" type="url" inputMode="url" placeholder="https://" defaultValue={v.website} />
        </div>
        <Field
          label="Co byste chtěli probrat"
          name="message"
          textarea
          defaultValue={v.message ?? initialMessage}
          hint="Stačí pár vět. Pomůže mi to připravit se."
        />
        <Consent privacyHref={privacyHref} error={state.errors?.consent} />
        <FormGuard siteKey={turnstileSiteKey} />
      </fieldset>

      {state.status === 'error' && state.message && (
        <p role="alert" className="field-error text-[1rem]">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="ui text-[1rem]" aria-live="polite">
          {slot ? (
            <>
              Vybráno: <strong>{fullFmt.format(new Date(slot))}</strong>
            </>
          ) : (
            <span className="text-pencil">Zatím nemáte vybraný čas.</span>
          )}
        </p>
        <button type="submit" className="btn btn-primary" disabled={pending || !slot} data-umami-event="rezervace">
          {pending ? 'Rezervuji…' : 'Potvrdit rezervaci'}
        </button>
      </div>
    </form>
  )
}
