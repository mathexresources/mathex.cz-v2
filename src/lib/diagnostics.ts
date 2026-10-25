import nodemailer from 'nodemailer'
import type { Payload } from 'payload'

import { getBusyIntervals, resetBusyCache } from './busy-calendar'
import { renderEmail } from './email-template'
import { env } from './env'
import { formatDateTime } from './time'

export type CheckStatus = 'ok' | 'warn' | 'error' | 'off'
export type Check = { id: string; label: string; status: CheckStatus; detail: string; help?: string }

const smtpConfigured = () => Boolean(process.env.SMTP_HOST)

function smtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
  })
}

async function checkSmtp(): Promise<Check> {
  const base = { id: 'smtp', label: 'Odesílání e-mailů (SMTP)' }
  if (!smtpConfigured()) {
    return {
      ...base,
      status: 'warn',
      detail: 'SMTP není nastavené. E-maily se jen vypisují do logu (docker compose logs web).',
      help: 'Vyplň SMTP_HOST, SMTP_USER, SMTP_PASS a SMTP_FROM_ADDRESS v .env a restartuj web.',
    }
  }
  try {
    await smtpTransport().verify()
    return {
      ...base,
      status: 'ok',
      detail: `Připojeno k ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}, odesílatel ${process.env.SMTP_FROM_ADDRESS || '(nevyplněno)'}.`,
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      detail: `Server ${process.env.SMTP_HOST} odmítl připojení: ${(err as Error).message}`,
      help: 'Zkontroluj adresu serveru, port (587 nebo 465), jméno a heslo.',
    }
  }
}

async function checkBusyCalendar(): Promise<Check> {
  const base = { id: 'calendar', label: 'Obsazenost z Google Kalendáře' }
  if (!process.env.BUSY_CALENDAR_ICS_URL) {
    return {
      ...base,
      status: 'off',
      detail: 'Nepoužívá se. Rezervace vidí jen schůzky zadané přes web.',
      help: 'Do BUSY_CALENDAR_ICS_URL vlož tajnou iCal adresu svého Google Kalendáře.',
    }
  }
  resetBusyCache()
  const now = new Date()
  const result = await getBusyIntervals(now, new Date(now.getTime() + 30 * 86400000), { throwOnError: true }).then(
    (items) => ({ items }),
    (err: Error) => ({ error: err.message }),
  )
  if ('error' in result) {
    return { ...base, status: 'error', detail: `Kalendář se nepodařilo načíst: ${result.error}`, help: 'Zkontroluj, že je adresa celá a kalendář existuje.' }
  }
  return { ...base, status: 'ok', detail: `Načteno. V příštích 30 dnech ${result.items.length} obsazených bloků, které se v rezervacích nenabídnou.` }
}

function checkTurnstile(): Check {
  const base = { id: 'turnstile', label: 'Antispam Cloudflare Turnstile' }
  const site = env.turnstileSiteKey
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!site && !secret) {
    return { ...base, status: 'off', detail: 'Vypnutý. Formuláře chrání honeypot, časová kontrola a limit odeslání.' }
  }
  if (!site || !secret) {
    return {
      ...base,
      status: 'error',
      detail: `Chybí ${site ? 'TURNSTILE_SECRET_KEY' : 'TURNSTILE_SITE_KEY'} – formuláře by nešlo odeslat.`,
      help: 'Vyplň oba klíče, nebo oba smaž.',
    }
  }
  return { ...base, status: 'ok', detail: 'Oba klíče jsou nastavené.' }
}

function checkAnalytics(): Check {
  const base = { id: 'analytics', label: 'Analytika návštěvnosti' }
  if (env.plausibleDomain) return { ...base, status: 'ok', detail: `Plausible pro ${env.plausibleDomain}.` }
  if (env.umamiWebsiteId && env.umamiSrc) return { ...base, status: 'ok', detail: 'Umami je zapnutá.' }
  if (env.umamiWebsiteId || env.umamiSrc) {
    return { ...base, status: 'error', detail: 'Umami potřebuje UMAMI_WEBSITE_ID i UMAMI_SRC.' }
  }
  return { ...base, status: 'off', detail: 'Vypnutá.' }
}

function checkSiteUrl(): Check {
  const base = { id: 'site-url', label: 'Adresa webu (SITE_URL)' }
  const url = env.siteUrl
  if (!url.startsWith('https://')) {
    return {
      ...base,
      status: 'warn',
      detail: `${url} – bez HTTPS. Odkazy v e-mailech a pro Google budou vést sem.`,
      help: 'Po zveřejnění nastav SITE_URL=https://tvoje-domena.cz.',
    }
  }
  return { ...base, status: 'ok', detail: url }
}

function checkCalendarFeed(): Check {
  const base = { id: 'feed', label: 'Odběr rezervací do kalendáře' }
  const token = process.env.CALENDAR_FEED_TOKEN
  if (!token) return { ...base, status: 'off', detail: 'Vypnutý (chybí CALENDAR_FEED_TOKEN).' }
  if (token.length < 16) return { ...base, status: 'warn', detail: 'Token je krátký – použij aspoň 24 znaků.' }
  return {
    ...base,
    status: 'ok',
    detail: 'Adresu pro Google Kalendář („Přidat podle URL“) najdeš níže.',
  }
}

export async function runDiagnostics(): Promise<Check[]> {
  const [smtp, calendar] = await Promise.all([checkSmtp(), checkBusyCalendar()])
  return [checkSiteUrl(), smtp, calendar, checkCalendarFeed(), checkTurnstile(), checkAnalytics()]
}

export function calendarFeedUrl() {
  const token = process.env.CALENDAR_FEED_TOKEN
  return token ? `${env.siteUrl}/kalendar.ics?token=${encodeURIComponent(token)}` : null
}

/** Odešle zkušební e-mail přes stejnou cestu jako potvrzení rezervací. */
export async function sendTestEmail(payload: Payload, to: string) {
  const site = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const brand = site.brandName || 'Mathex'
  const mail = renderEmail({
    brand,
    heading: 'Zkušební e-mail z webu',
    intro: `Pokud čteš tenhle e-mail, odesílání funguje. Odesláno ${formatDateTime(new Date())}.`,
    rows: [
      { label: 'Server', value: process.env.SMTP_HOST || '(není nastaven – e-mail šel jen do logu)' },
      { label: 'Odesílatel', value: process.env.SMTP_FROM_ADDRESS || '' },
      { label: 'Web', value: env.siteUrl },
    ],
    footer: 'Tip: zkontroluj, že e-mail nepřišel do spamu. Pokud ano, nastav pro doménu SPF, DKIM a DMARC.',
  })
  await payload.sendEmail({ to, subject: `Zkušební e-mail – ${brand}`, ...mail })
  return { delivered: smtpConfigured() }
}
