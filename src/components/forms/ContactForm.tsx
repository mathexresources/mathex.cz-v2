'use client'

import { useActionState } from 'react'

import { sendInquiry, type ContactState } from '@/actions/contact'

import { Consent, Field } from './Field'
import { FormGuard } from './FormGuard'

const initial: ContactState = { status: 'idle' }

export function ContactForm({
  privacyHref,
  source,
  turnstileSiteKey,
  initialMessage,
}: {
  privacyHref: string
  source: string
  turnstileSiteKey?: string
  initialMessage?: string
}) {
  const [state, action, pending] = useActionState(sendInquiry, initial)
  const v = state.values ?? {}

  if (state.status === 'success') {
    return (
      <div role="status" className="border-l-4 border-tape bg-surface p-6">
        <p className="ui text-[1.25rem] font-bold">Zpráva odeslaná</p>
        <p className="mt-2 text-pencil">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jméno" name="name" defaultValue={v.name} required autoComplete="name" error={state.errors?.name} />
        <Field label="E-mail" name="email" defaultValue={v.email} type="email" required autoComplete="email" inputMode="email" error={state.errors?.email} />
        <Field label="Telefon" name="phone" defaultValue={v.phone} type="tel" autoComplete="tel" inputMode="tel" />
        <Field label="Firma" name="company" defaultValue={v.company} autoComplete="organization" />
        <Field label="Představa o rozpočtu" name="budget" defaultValue={v.budget} placeholder="např. do 20 000 Kč" />
        <Field label="Kdy to potřebujete" name="deadline" defaultValue={v.deadline} placeholder="např. do konce měsíce" />
      </div>
      <Field
        label="Co potřebujete"
        name="message"
        defaultValue={v.message ?? initialMessage}
        textarea
        required
        error={state.errors?.message}
        hint="U webu: čím se zabýváte a co by měl umět. U přednášky: pro koho, kolik lidí, kde a kdy."
      />
      <input type="hidden" name="source" value={source} />
      <Consent privacyHref={privacyHref} error={state.errors?.consent} />
      <FormGuard siteKey={turnstileSiteKey} />

      {state.status === 'error' && state.message && (
        <p role="alert" className="field-error text-[1rem]">
          {state.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending} data-umami-event="poptavka">
        {pending ? 'Odesílám…' : 'Odeslat zprávu'}
      </button>
    </form>
  )
}
