import 'server-only'

import { headers } from 'next/headers'

/** Ochrana formulářů: omezení počtu odeslání, honeypot, minimální doba vyplnění, Turnstile. */

const buckets = new Map<string, { count: number; reset: number }>()

export async function clientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k)
    }
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

/** Vrátí true, pokud formulář vypadá jako od robota. */
export function looksLikeBot(form: FormData): boolean {
  if (String(form.get('company_website') ?? '').trim()) return true
  const startedAt = Number(form.get('started_at') ?? 0)
  if (!startedAt || Date.now() - startedAt < 2500) return true
  return false
}

export async function verifyTurnstile(form: FormData, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  const token = String(form.get('cf-turnstile-response') ?? '')
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip !== 'unknown') body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

export { clean, isEmail } from './guard-shared'
