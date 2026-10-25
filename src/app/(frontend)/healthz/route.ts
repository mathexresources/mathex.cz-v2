import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/** Kontrola stavu pro Docker: web běží a databáze odpovídá. */
export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users' })
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[healthz]', err)
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
