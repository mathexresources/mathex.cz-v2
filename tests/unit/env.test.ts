import { afterEach, describe, expect, it } from 'vitest'

import { env } from '@/lib/env'

const saved = { ...process.env }
afterEach(() => {
  process.env = { ...saved }
})

describe('nastavení za běhu', () => {
  it('čte SITE_URL a ořízne lomítko', () => {
    process.env.SITE_URL = 'https://mathex.cz/'
    expect(env.siteUrl).toBe('https://mathex.cz')
  })

  it('starší NEXT_PUBLIC_SITE_URL funguje jako záloha', () => {
    delete process.env.SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://stary.cz'
    expect(env.siteUrl).toBe('https://stary.cz')
  })

  it('prázdná hodnota se bere jako nenastavená', () => {
    process.env.TURNSTILE_SITE_KEY = '   '
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    expect(env.turnstileSiteKey).toBeUndefined()
  })
})
