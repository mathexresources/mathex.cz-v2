import { describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

const { clean, isEmail, looksLikeBot, rateLimit, verifyTurnstile } = await import('@/lib/guard')
const { renderEmail } = await import('@/lib/email-template')

const form = (entries: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.set(k, v)
  return f
}

describe('ochrana formulářů', () => {
  it('pozná robota podle vyplněného honeypotu', () => {
    expect(looksLikeBot(form({ company_website: 'spam.com', started_at: String(Date.now() - 10000) }))).toBe(true)
  })

  it('pozná robota podle příliš rychlého odeslání', () => {
    expect(looksLikeBot(form({ started_at: String(Date.now() - 500) }))).toBe(true)
    expect(looksLikeBot(form({}))).toBe(true)
  })

  it('člověka pustí', () => {
    expect(looksLikeBot(form({ started_at: String(Date.now() - 8000) }))).toBe(false)
  })

  it('omezí počet odeslání a po čase zase pustí', () => {
    vi.useFakeTimers()
    const key = `test-${Math.random()}`
    expect([1, 2, 3].map(() => rateLimit(key, 2, 1000))).toEqual([true, true, false])
    vi.advanceTimersByTime(1001)
    expect(rateLimit(key, 2, 1000)).toBe(true)
    vi.useRealTimers()
  })

  it('kontroluje e-mail', () => {
    expect(isEmail('petr@example.com')).toBe(true)
    expect(isEmail('petr@example')).toBe(false)
    expect(isEmail('petr example@x.cz')).toBe(false)
  })

  it('čistí vstup od řídicích znaků a ořízne délku', () => {
    expect(clean('  ahoj\u0000\u0007  ')).toBe('ahoj')
    expect(clean('x'.repeat(50), 10)).toHaveLength(10)
    expect(clean(null)).toBe('')
  })

  it('Turnstile bez klíče formulář nezdržuje', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    expect(await verifyTurnstile(form({}), '1.2.3.4')).toBe(true)
  })

  it('Turnstile s klíčem a bez tokenu odmítne', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    expect(await verifyTurnstile(form({}), '1.2.3.4')).toBe(false)
    delete process.env.TURNSTILE_SECRET_KEY
  })

  it('Turnstile ověří token u Cloudflare', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ success: true }))
    expect(await verifyTurnstile(form({ 'cf-turnstile-response': 'tok' }), '1.2.3.4')).toBe(true)
    const body = fetchMock.mock.calls[0][1]?.body as URLSearchParams
    expect(body.get('secret')).toBe('secret')
    expect(body.get('response')).toBe('tok')
    expect(body.get('remoteip')).toBe('1.2.3.4')
    fetchMock.mockResolvedValue(Response.json({ success: false }))
    expect(await verifyTurnstile(form({ 'cf-turnstile-response': 'tok' }), '1.2.3.4')).toBe(false)
    fetchMock.mockRestore()
    delete process.env.TURNSTILE_SECRET_KEY
  })
})

describe('šablona e-mailu', () => {
  it('escapuje HTML z formuláře', () => {
    const { html, text } = renderEmail({
      brand: 'Mathex',
      heading: 'Nová poptávka',
      intro: '<script>alert(1)</script>',
      rows: [{ label: 'Jméno', value: '<b>Petr</b>' }],
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;b&gt;Petr&lt;/b&gt;')
    expect(text).toContain('Jméno: <b>Petr</b>')
  })

  it('vynechá prázdné řádky a přidá tlačítko', () => {
    const { html, text } = renderEmail({
      brand: 'Mathex',
      heading: 'X',
      intro: 'Y',
      rows: [
        { label: 'Telefon', value: '' },
        { label: 'E-mail', value: 'a@b.cz' },
      ],
      action: { label: 'Zrušit', url: 'https://mathex.cz/rezervace/zrusit?token=abc' },
    })
    expect(html).not.toContain('Telefon')
    expect(html).toContain('href="https://mathex.cz/rezervace/zrusit?token=abc"')
    expect(text).toContain('Zrušit: https://mathex.cz/rezervace/zrusit?token=abc')
  })
})
