import type { Endpoint } from 'payload'

import { isEmail } from '@/lib/guard-shared'
import { calendarFeedUrl, calendarFeedWebcal, runDiagnostics, sendTestEmail } from '@/lib/diagnostics'

const unauthorized = () => Response.json({ error: 'Přihlas se do administrace.' }, { status: 401 })

/** GET /api/diagnostika – stav externích služeb (jen pro přihlášené) */
export const diagnosticsEndpoint: Endpoint = {
  path: '/diagnostika',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return unauthorized()
    const checks = await runDiagnostics(req.payload)
    return Response.json(
      { checks, calendarFeedUrl: calendarFeedUrl(), calendarFeedWebcal: calendarFeedWebcal(), userEmail: req.user.email },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  },
}

/** POST /api/diagnostika/test-email – pošle zkušební e-mail (jen pro přihlášené) */
export const testEmailEndpoint: Endpoint = {
  path: '/diagnostika/test-email',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return unauthorized()
    let to = String(req.user.email || '')
    try {
      const body = (await req.json?.()) as { to?: string } | undefined
      if (body?.to) to = String(body.to).trim()
    } catch {
      // bez těla → pošle se přihlášenému uživateli
    }
    if (!isEmail(to)) return Response.json({ error: 'Neplatná e-mailová adresa.' }, { status: 400 })
    try {
      const { delivered } = await sendTestEmail(req.payload, to)
      return Response.json({
        ok: true,
        message: delivered
          ? `Odesláno na ${to}. Zkontroluj schránku (i spam).`
          : 'SMTP není nastavené – e-mail se jen vypsal do logu (docker compose logs web).',
      })
    } catch (err) {
      return Response.json({ ok: false, error: `Odeslání selhalo: ${(err as Error).message}` }, { status: 502 })
    }
  },
}
