'use client'

import { useActionState, useState } from 'react'

import { sendInquiry, type ContactState } from '@/actions/contact'

import { Consent, Field } from './Field'
import { FormGuard } from './FormGuard'

const initial: ContactState = { status: 'idle' }

export type ContactTopic = 'web' | 'prednaska' | 'jine'

const TOPICS: Record<
  ContactTopic,
  {
    label: string
    extra: [{ label: string; name: string; placeholder: string }, { label: string; name: string; placeholder: string }] | null
    messageLabel: string
    placeholder: string
  }
> = {
  web: {
    label: 'Web',
    extra: [
      { label: 'Představa o rozpočtu', name: 'budget', placeholder: 'např. do 30 000 Kč' },
      { label: 'Kdy to potřebujete', name: 'deadline', placeholder: 'např. do konce měsíce' },
    ],
    messageLabel: 'Co by měl web umět',
    placeholder: 'Čím se zabýváte, pro koho je web a co na něm má být. Pokud už nějaký web máte, pošlete odkaz.',
  },
  prednaska: {
    label: 'Přednáška',
    extra: [
      { label: 'Pro koho a kolik lidí', name: 'audience', placeholder: 'např. 25 zaměstnanců, 2. stupeň ZŠ' },
      { label: 'Kdy a kde', name: 'deadline', placeholder: 'např. listopad, Praha, nebo online' },
    ],
    messageLabel: 'Co vás zajímá',
    placeholder: 'Která témata vás zajímají (phishing, OSINT, hesla…) a s čím mají vaši lidé zkušenost.',
  },
  jine: {
    label: 'Něco jiného',
    extra: null,
    messageLabel: 'Zpráva',
    placeholder: 'S čím vám můžu pomoct?',
  },
}

export function ContactForm({
  privacyHref,
  source,
  turnstileSiteKey,
  initialTopic = 'web',
}: {
  privacyHref: string
  source: string
  turnstileSiteKey?: string
  initialTopic?: ContactTopic
}) {
  const [state, action, pending] = useActionState(sendInquiry, initial)
  const v = state.values ?? {}
  const [topic, setTopic] = useState<ContactTopic>((v.topic as ContactTopic) || initialTopic)
  const t = TOPICS[topic]

  if (state.status === 'success') {
    return (
      <div role="status" className="border-l-4 border-tape bg-paper p-6">
        <p className="ui text-[1.35rem] font-bold">Zpráva odeslaná</p>
        <p className="mt-2 text-pencil">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} className="relative min-w-0 space-y-6" noValidate>
      <fieldset className="min-w-0">
        <legend className="field-label">S čím se ozýváte</legend>
        <div className="ui grid grid-cols-3 gap-1 rounded-lg border border-line bg-paper p-1">
          {(Object.keys(TOPICS) as ContactTopic[]).map((key) => (
            <label
              key={key}
              className="relative flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-md px-2 text-center text-[0.95rem] font-semibold leading-tight text-pencil transition-colors hover:text-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-tape"
            >
              <input
                type="radio"
                name="topic"
                value={key}
                defaultChecked={topic === key}
                onChange={() => setTopic(key)}
                className="sr-only"
              />
              {TOPICS[key].label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
        <Field label="Jméno" name="name" defaultValue={v.name} required autoComplete="name" error={state.errors?.name} />
        <Field label="E-mail" name="email" defaultValue={v.email} type="email" required autoComplete="email" inputMode="email" error={state.errors?.email} />
        <Field label="Telefon" name="phone" defaultValue={v.phone} type="tel" autoComplete="tel" inputMode="tel" />
        <Field label={topic === 'prednaska' ? 'Škola, firma nebo organizace' : 'Firma'} name="company" defaultValue={v.company} autoComplete="organization" />
        {t.extra?.map((f) => (
          <Field key={`${topic}-${f.name}`} label={f.label} name={f.name} defaultValue={v[f.name]} placeholder={f.placeholder} />
        ))}
      </div>

      <Field
        key={`msg-${topic}`}
        label={t.messageLabel}
        name="message"
        defaultValue={v.message}
        placeholder={t.placeholder}
        textarea
        required
        error={state.errors?.message}
      />
      <input type="hidden" name="source" value={source} />
      <Consent privacyHref={privacyHref} error={state.errors?.consent} />
      <FormGuard siteKey={turnstileSiteKey} />

      {state.status === 'error' && state.message && (
        <p role="alert" className="field-error text-[1rem]">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <button type="submit" className="btn btn-primary" disabled={pending} data-umami-event="poptavka">
          {pending ? 'Odesílám…' : 'Odeslat zprávu'}
        </button>
        <p className="ui text-[0.9rem] text-pencil">Odpovídám do jednoho pracovního dne.</p>
      </div>
    </form>
  )
}
