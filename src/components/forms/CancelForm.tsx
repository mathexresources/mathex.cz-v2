'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { cancelBooking, type CancelState } from '@/actions/booking'

const initial: CancelState = { status: 'idle' }

export function CancelForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(cancelBooking, initial)

  if (state.status === 'success') {
    return (
      <div role="status" className="border-l-4 border-tape bg-surface p-6">
        <p className="ui text-[1.25rem] font-bold">{state.message}</p>
        <Link href="/rezervace" className="btn btn-primary mt-5">
          Vybrat nový termín
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <p>Opravdu chcete rezervaci zrušit? Uvolněný termín se hned nabídne dalším zájemcům.</p>
      {state.status === 'error' && (
        <p role="alert" className="field-error text-[1rem]">
          {state.message}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Ruším…' : 'Zrušit rezervaci'}
        </button>
        <Link href="/" className="btn btn-secondary">
          Nechat rezervaci
        </Link>
      </div>
    </form>
  )
}
