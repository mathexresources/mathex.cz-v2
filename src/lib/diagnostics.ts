import nodemailer from 'nodemailer'
import type { Payload } from 'payload'

import { getBusyIntervals, resetBusyCache, type SourceReport } from './busy-calendar'
import { caldavConfigured, listCalendars, parseNames } from './caldav'
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

async function checkCalendars(payload: Payload): Promise<Check[]> {
  const settings = await payload.findGlobal({ slug: 'booking-settings', depth: 0, overrideAccess: true })
  const busyNames = parseNames(settings.calendar?.busyCalendars)
  const bookingCalendar = (settings.calendar?.bookingCalendar ?? '').trim()
  const icsUrls = (settings.icsUrls ?? []).map((c) => c.url).filter(Boolean)
  const checks: Check[] = []

  // --- iCloud / CalDAV ---
  const caldav = { id: 'caldav', label: 'Kalendář v iPhonu (iCloud)' }
  if (!caldavConfigured()) {
    checks.push({
      ...caldav,
      status: 'off',
      detail: 'Nepřipojený. Volné termíny se počítají jen z pracovní doby, blokací a rezervací z webu.',
      help: 'Do .env na serveru dej CALDAV_USERNAME (Apple ID) a CALDAV_PASSWORD (heslo pro aplikace z appleid.apple.com), pak restartuj web.',
    })
  } else {
    try {
      const calendars = await listCalendars(true)
      const names = calendars.map((c) => c.name)
      const missingBusy = (busyNames ?? []).filter((n) => !names.some((x) => x.localeCompare(n, 'cs', { sensitivity: 'base' }) === 0))
      const bookingOk = !bookingCalendar || names.some((x) => x.localeCompare(bookingCalendar, 'cs', { sensitivity: 'base' }) === 0)
      resetBusyCache()
      const now = new Date()
      const report: SourceReport[] = []
      await getBusyIntervals(now, new Date(now.getTime() + 30 * 86400000), {
        sources: { caldavCalendars: missingBusy.length ? null : busyNames },
        report,
      })
      const busyCount = report.find((r) => r.source === 'caldav')?.count ?? 0
      const problems = [
        missingBusy.length ? `Nenalezené kalendáře: ${missingBusy.join(', ')}.` : '',
        bookingOk ? '' : `Kalendář pro rezervace „${bookingCalendar}“ neexistuje.`,
      ].filter(Boolean)
      checks.push({
        ...caldav,
        status: problems.length ? 'error' : bookingCalendar ? 'ok' : 'warn',
        detail: [
          `Připojeno. Kalendáře: ${names.join(', ') || 'žádné'}.`,
          `Termíny blokuje: ${busyNames ? busyNames.join(', ') : 'všechny'} – v příštích 30 dnech ${busyCount} obsazených bloků.`,
          bookingCalendar ? `Rezervace se zapisují do „${bookingCalendar}“.` : 'Rezervace se do iCloudu zatím nezapisují.',
          ...problems,
        ].join(' '),
        help: problems.length
          ? 'Oprav názvy v Nastavení rezervací → Kalendář v iPhonu (musí přesně odpovídat názvům v iPhonu).'
          : bookingCalendar
            ? undefined
            : 'V Nastavení rezervací vyplň „Do kterého kalendáře zapisovat rezervace“.',
      })
    } catch (err) {
      checks.push({ ...caldav, status: 'error', detail: (err as Error).message })
    }
  }

  // --- kalendáře podle adresy ---
  const ics = { id: 'calendar', label: 'Kalendáře podle adresy (iCal)' }
  const allUrls = [...icsUrls, ...(process.env.BUSY_CALENDAR_ICS_URL ? [process.env.BUSY_CALENDAR_ICS_URL] : [])]
  if (!allUrls.length) {
    checks.push({ ...ics, status: 'off', detail: 'Žádné. Můžeš přidat např. Google Kalendář v Nastavení rezervací.' })
  } else {
    resetBusyCache()
    const now = new Date()
    const report: SourceReport[] = []
    await getBusyIntervals(now, new Date(now.getTime() + 30 * 86400000), { sources: { icsUrls }, report })
    const bad = report.filter((r) => !r.ok)
    const total = report.reduce((a, r) => a + r.count, 0)
    checks.push({
      ...ics,
      status: bad.length ? 'error' : 'ok',
      detail: bad.length
        ? `Kalendář se nepodařilo načíst: ${bad.map((b) => b.error).join('; ')}`
        : `Načteno ${report.length} ${report.length === 1 ? 'kalendář' : 'kalendáře'}. V příštích 30 dnech ${total} obsazených bloků, které se v rezervacích nenabídnou.`,
      help: bad.length ? 'Zkontroluj, že je adresa celá a kalendář existuje.' : undefined,
    })
  }
  return checks
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
    detail: 'Odkazy pro přidání do iPhonu a Google Kalendáře najdeš níže.',
  }
}

export async function runDiagnostics(payload: Payload): Promise<Check[]> {
  const [smtp, calendars] = await Promise.all([checkSmtp(), checkCalendars(payload)])
  return [checkSiteUrl(), smtp, ...calendars, checkCalendarFeed(), checkTurnstile(), checkAnalytics()]
}

export function calendarFeedUrl() {
  const token = process.env.CALENDAR_FEED_TOKEN
  return token ? `${env.siteUrl}/kalendar.ics?token=${encodeURIComponent(token)}` : null
}

/** webcal:// odkaz – na iPhonu otevře rovnou „Přidat odebíraný kalendář“. */
export function calendarFeedWebcal() {
  const url = calendarFeedUrl()
  return url ? url.replace(/^https?:\/\//, 'webcal://') : null
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
