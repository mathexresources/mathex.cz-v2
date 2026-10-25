'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

/**
 * Neviditelná ochrana proti spamu:
 * – honeypot pole, které člověk nevidí a robot vyplní,
 * – čas otevření formuláře (robot odesílá okamžitě),
 * – volitelně Cloudflare Turnstile, pokud je nastavený klíč.
 */
export function FormGuard() {
  const [startedAt, setStartedAt] = useState('')
  useEffect(() => setStartedAt(String(Date.now())), [])
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  return (
    <>
      <input type="hidden" name="started_at" value={startedAt} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Nevyplňujte
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile" data-sitekey={siteKey} data-language="cs" data-theme="auto" />
        </>
      )}
    </>
  )
}
