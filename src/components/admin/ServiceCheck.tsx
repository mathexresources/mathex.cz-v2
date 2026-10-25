'use client'

import { useCallback, useEffect, useState } from 'react'

type Check = { id: string; label: string; status: 'ok' | 'warn' | 'error' | 'off'; detail: string; help?: string }
type Data = { checks: Check[]; calendarFeedUrl: string | null; userEmail: string }

const STATUS: Record<Check['status'], { label: string; color: string }> = {
  ok: { label: 'Funguje', color: '#1f6f43' },
  warn: { label: 'Pozor', color: '#a15c07' },
  error: { label: 'Chyba', color: '#b42318' },
  off: { label: 'Vypnuto', color: '#6b7280' },
}

/** Panel na nástěnce administrace: stav e-mailů, kalendáře, antispamu a analytiky. */
export function ServiceCheck() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [to, setTo] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/diagnostika', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as Data
      setData(json)
      setTo((prev) => prev || json.userEmail)
      setOpen((prev) => prev || json.checks.some((c) => c.status === 'error' || c.status === 'warn'))
    } catch (err) {
      setError(`Kontrolu se nepodařilo načíst (${(err as Error).message}).`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sendTest = async () => {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/diagnostika/test-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      })
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string }
      setResult({ ok: Boolean(json.ok), text: json.message || json.error || 'Neznámá odpověď' })
    } catch (err) {
      setResult({ ok: false, text: (err as Error).message })
    } finally {
      setSending(false)
    }
  }

  const problems = data?.checks.filter((c) => c.status === 'error' || c.status === 'warn').length ?? 0

  return (
    <section
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 6,
        padding: '16px 20px',
        marginBottom: 32,
        background: 'var(--theme-elevation-0)',
      }}
      data-testid="service-check"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
        >
          <strong style={{ fontSize: 18 }}>Kontrola služeb</strong>{' '}
          <span style={{ color: 'var(--theme-elevation-500)' }}>
            {loading
              ? 'kontroluji…'
              : error
                ? 'nepodařilo se načíst'
                : problems
                  ? `${problems} ${problems === 1 ? 'věc potřebuje' : 'věci potřebují'} pozornost`
                  : 'vše v pořádku'}
          </span>{' '}
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
        <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => void load()} disabled={loading}>
          Zkontrolovat znovu
        </button>
      </div>

      {error && <p style={{ color: STATUS.error.color }}>{error}</p>}

      {open && data && (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
            {data.checks.map((c) => (
              <li
                key={c.id}
                data-check={c.id}
                data-status={c.status}
                style={{ display: 'grid', gridTemplateColumns: '7rem 1fr', gap: 12, padding: '10px 0', borderTop: '1px solid var(--theme-elevation-100)' }}
              >
                <span style={{ color: STATUS[c.status].color, fontWeight: 600 }}>● {STATUS[c.status].label}</span>
                <span>
                  <strong>{c.label}</strong>
                  <br />
                  {c.detail}
                  {c.help && (
                    <>
                      <br />
                      <span style={{ color: 'var(--theme-elevation-500)' }}>{c.help}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {data.calendarFeedUrl && (
            <p style={{ marginTop: 12 }}>
              Adresa pro odběr rezervací v Google Kalendáři (Další kalendáře → Přidat podle URL):
              <br />
              <code style={{ wordBreak: 'break-all' }}>{data.calendarFeedUrl}</code>
            </p>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="test-email-to">Poslat zkušební e-mail na</label>
            <input
              id="test-email-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ padding: '6px 10px', minWidth: 260, border: '1px solid var(--theme-elevation-250)', borderRadius: 4 }}
            />
            <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => void sendTest()} disabled={sending || !to}>
              {sending ? 'Odesílám…' : 'Odeslat'}
            </button>
          </div>
          {result && (
            <p role="status" style={{ marginTop: 8, color: result.ok ? STATUS.ok.color : STATUS.error.color }}>
              {result.text}
            </p>
          )}
        </>
      )}
    </section>
  )
}
