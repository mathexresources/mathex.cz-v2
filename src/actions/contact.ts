'use server'

import { sendInquiryEmails } from '@/lib/booking-emails'
import { clean, clientIp, isEmail, looksLikeBot, rateLimit, verifyTurnstile } from '@/lib/guard'
import { getPayloadClient } from '@/lib/payload'

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<'name' | 'email' | 'message' | 'consent', string>>
  /** Odeslané hodnoty – aby uživatel o text nepřišel, když něco chybí */
  values?: Record<string, string>
}

const TOPIC_LABELS: Record<string, string> = { web: 'Web', prednaska: 'Přednáška', jine: 'Něco jiného' }

export async function sendInquiry(_prev: ContactState, form: FormData): Promise<ContactState> {
  const ip = await clientIp()
  if (!rateLimit(`inquiry:${ip}`, 5, 60 * 60 * 1000)) {
    return { status: 'error', message: 'Z vaší adresy přišlo moc zpráv. Zkuste to prosím za hodinu.' }
  }
  if (looksLikeBot(form)) {
    return { status: 'error', message: 'Zprávu se nepodařilo odeslat. Počkejte pár vteřin a zkuste to znovu.' }
  }
  if (!(await verifyTurnstile(form, ip))) {
    return { status: 'error', message: 'Ověření, že nejste robot, se nepovedlo. Obnovte stránku a zkuste to znovu.' }
  }

  const topic = TOPIC_LABELS[String(form.get('topic'))] ? String(form.get('topic')) : 'jine'
  const audience = clean(form.get('audience'), 200)
  const data = {
    name: clean(form.get('name'), 120),
    email: clean(form.get('email'), 200).toLowerCase(),
    phone: clean(form.get('phone'), 40),
    company: clean(form.get('company'), 160),
    budget: clean(form.get('budget'), 60),
    deadline: clean(form.get('deadline'), 60),
    message: clean(form.get('message'), 5000),
    source: clean(form.get('source'), 200),
    consent: form.get('consent') === 'on',
  }

  const errors: ContactState['errors'] = {}
  if (data.name.length < 2) errors.name = 'Napište své jméno.'
  if (!isEmail(data.email)) errors.email = 'Zkontrolujte e-mail, odpovím právě na něj.'
  if (data.message.length < 10) errors.message = 'Napište pár slov o tom, co potřebujete.'
  if (!data.consent) errors.consent = 'Bez souhlasu vám nemůžu odpovědět.'
  const { consent: _consent, ...values } = data
  if (Object.keys(errors).length) {
    return { status: 'error', errors, values: { ...values, topic, audience }, message: 'Ve formuláři něco chybí.' }
  }

  // Téma a publikum se ukládají do zprávy, ať je v administraci a v e-mailu všechno pohromadě
  const header = [`Téma: ${TOPIC_LABELS[topic]}`, audience && `Pro koho: ${audience}`].filter(Boolean).join('\n')
  data.message = `${header}\n\n${data.message}`

  const payload = await getPayloadClient()
  const doc = await payload.create({
    collection: 'inquiries',
    data: { ...data, status: 'new' },
    overrideAccess: true,
  })
  await sendInquiryEmails(payload, { ...data, id: doc.id })

  return { status: 'success', message: 'Děkuji, zpráva dorazila. Ozvu se do jednoho pracovního dne.' }
}
