/**
 * Prostředí pro end-to-end testy (spouští ho Playwright jako webServer):
 *  1. vyčistí testovací databázi,
 *  2. spustí zachytávací SMTP server (e-maily se nikam neposílají),
 *  3. spustí falešný „Google Kalendář“ s jedním obsazeným dnem,
 *  4. spustí produkční build webu (.next/standalone/server.js).
 *
 * Zachycené e-maily:  GET/DELETE http://127.0.0.1:2526/messages
 * Obsazený den:       GET        http://127.0.0.1:2526/busy-day
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { simpleParser } from 'mailparser'
import pg from 'pg'
import { SMTPServer } from 'smtp-server'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DATABASE_URI = process.env.E2E_DATABASE_URI || 'postgres://mathex:mathex@127.0.0.1:5433/mathex_e2e'
const PORT = Number(process.env.E2E_PORT || 3100)
const SMTP_PORT = 2525
const HELPER_PORT = 2526

// ---------- 1. čistá databáze ----------
{
  const url = new URL(DATABASE_URI)
  const dbName = url.pathname.slice(1)
  const admin = new pg.Client({ connectionString: Object.assign(new URL(url), { pathname: '/postgres' }).toString() })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`)
  await admin.query(`CREATE DATABASE "${dbName}"`)
  await admin.end()
  console.log(`[e2e] databáze ${dbName} je čistá`)
}

// ---------- 2. zachytávací SMTP ----------
const messages = []
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  logger: false,
  onAuth(_auth, _session, cb) {
    cb(null, { user: 'test' })
  },
  onData(stream, session, cb) {
    simpleParser(stream)
      .then((mail) => {
        messages.push({
          envelopeTo: session.envelope.rcptTo.map((r) => r.address),
          from: mail.from?.text,
          to: mail.to?.text,
          replyTo: mail.replyTo?.text,
          subject: mail.subject,
          text: mail.text,
          html: mail.html || '',
          attachments: (mail.attachments || []).map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            content: a.content.toString('utf8'),
          })),
        })
        cb()
      })
      .catch(cb)
  },
})
await new Promise((resolve) => smtp.listen(SMTP_PORT, '127.0.0.1', resolve))

// ---------- 3. falešný kalendář: obsazený celý nejbližší pracovní den za 2+ dny ----------
const pragueKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(d)
let busyDay = new Date(Date.now() + 2 * 86400000)
while ([0, 6].includes(new Date(`${pragueKey(busyDay)}T12:00:00Z`).getUTCDay())) busyDay = new Date(busyDay.getTime() + 86400000)
const busyKey = pragueKey(busyDay)
const stamp = (key, hhmm) => `${key.replaceAll('-', '')}T${hhmm}00`
const busyIcs = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//E2E//EN',
  'BEGIN:VEVENT',
  'UID:e2e-busy@test',
  `DTSTART;TZID=Europe/Prague:${stamp(busyKey, '0600')}`,
  `DTEND;TZID=Europe/Prague:${stamp(busyKey, '2000')}`,
  'SUMMARY:Celý den obsazeno',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

http
  .createServer((req, res) => {
    if (req.url === '/messages' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify(messages))
    }
    if (req.url === '/messages' && req.method === 'DELETE') {
      messages.length = 0
      return res.end('ok')
    }
    if (req.url === '/busy.ics') {
      res.setHeader('Content-Type', 'text/calendar')
      return res.end(busyIcs)
    }
    if (req.url === '/busy-day') return res.end(busyKey)
    if (req.url === '/calendar-days') {
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ workDay, privateDay, weeklyDay, onceDay }))
    }
    if (req.url?.startsWith('/caldav/')) {
      // obsah kalendáře v CalDAV serveru (pro kontrolu, co web zapsal)
      return fetch(`${CALDAV}/test/${req.url.slice('/caldav/'.length)}/`, { headers: { Authorization: AUTH } })
        .then((r) => r.text())
        .then((t) => res.end(t))
    }
    res.statusCode = 404
    res.end()
  })
  .listen(HELPER_PORT, '127.0.0.1')

// ---------- 3b. CalDAV server (Radicale) – náhrada za iCloud ----------
// Tři kalendáře: „Práce“ (blokuje), „Soukromé“ (záměrně neblokuje), „Rezervace“ (sem se zapisují rezervace)
const CALDAV_PORT = 5232
const caldavDir = mkdtempSync(path.join(tmpdir(), 'mathex-caldav-'))
writeFileSync(path.join(caldavDir, 'users'), 'test:test\n')
const radicale = spawn(
  process.env.RADICALE_PYTHON || 'python3',
  [
    '-m', 'radicale',
    '--server-hosts', `127.0.0.1:${CALDAV_PORT}`,
    '--storage-filesystem-folder', path.join(caldavDir, 'data'),
    '--auth-type', 'htpasswd',
    '--auth-htpasswd-filename', path.join(caldavDir, 'users'),
    '--auth-htpasswd-encryption', 'plain',
    '--logging-level', 'warning',
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
const CALDAV = `http://127.0.0.1:${CALDAV_PORT}`
const AUTH = 'Basic ' + Buffer.from('test:test').toString('base64')
for (let i = 0; i < 50; i++) {
  try {
    await fetch(CALDAV + '/')
    break
  } catch {
    await new Promise((r) => setTimeout(r, 200))
  }
}
async function dav(method, url, body, headers = {}) {
  const res = await fetch(CALDAV + url, { method, body, headers: { Authorization: AUTH, ...headers } })
  if (res.status >= 400) throw new Error(`${method} ${url} → ${res.status} ${await res.text()}`)
  return res
}
const mkcal = (slug, name) =>
  dav(
    'MKCOL',
    `/test/${slug}/`,
    `<?xml version="1.0"?><D:mkcol xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:set><D:prop>` +
      `<D:resourcetype><D:collection/><C:calendar/></D:resourcetype><D:displayname>${name}</D:displayname>` +
      `<C:supported-calendar-component-set><C:comp name="VEVENT"/></C:supported-calendar-component-set>` +
      `</D:prop></D:set></D:mkcol>`,
    { 'Content-Type': 'application/xml' },
  )
await dav('PROPFIND', '/test/', undefined, { Depth: '0' }) // založí uživatele
await mkcal('prace', 'Práce')
await mkcal('soukrome', 'Soukromé')
await mkcal('rezervace', 'Rezervace')

// Dny pro testy kalendáře: 4 různé pracovní dny od +3 dnů, mimo den z falešného iCal
const days = []
for (let d = new Date(Date.now() + 3 * 86400000); days.length < 4; d = new Date(d.getTime() + 86400000)) {
  const key = pragueKey(d)
  const wd = new Date(`${key}T12:00:00Z`).getUTCDay()
  if (wd === 0 || wd === 6 || key === busyKey) continue
  days.push(key)
}
const [workDay, privateDay, weeklyDay, onceDay] = days
const putEvent = (cal, uid, key, from, to, summary) =>
  dav(
    'PUT',
    `/test/${cal}/${uid}.ics`,
    [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//E2E//EN',
      'BEGIN:VTIMEZONE', 'TZID:Europe/Prague',
      'BEGIN:STANDARD', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'END:STANDARD',
      'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'END:DAYLIGHT',
      'END:VTIMEZONE',
      'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:20260101T000000Z`,
      `DTSTART;TZID=Europe/Prague:${stamp(key, from)}`, `DTEND;TZID=Europe/Prague:${stamp(key, to)}`,
      `SUMMARY:${summary}`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n'),
    { 'Content-Type': 'text/calendar; charset=utf-8' },
  )
await putEvent('prace', 'e2e-prace', workDay, '0900', '1200', 'Porada')
await putEvent('soukrome', 'e2e-soukrome', privateDay, '0800', '1800', 'Soukromé – nemá blokovat')
console.log(`[e2e] CalDAV na ${CALDAV}, dny: ${days.join(', ')}`)

// ---------- 4. web ----------
const server = path.join(ROOT, '.next/standalone/server.js')
if (!existsSync(server)) {
  console.error('[e2e] Chybí build – spusť nejdřív `npm run build`.')
  process.exit(1)
}
const child = spawn(process.execPath, [server], {
  cwd: path.dirname(server),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    DATABASE_URI,
    PAYLOAD_SECRET: 'e2e-secret-0123456789abcdef',
    SITE_URL: `http://localhost:${PORT}`,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(SMTP_PORT),
    SMTP_USER: 'test',
    SMTP_PASS: 'test',
    SMTP_FROM_ADDRESS: 'web@mathex.test',
    SMTP_FROM_NAME: 'Mathex test',
    BUSY_CALENDAR_ICS_URL: `http://127.0.0.1:${HELPER_PORT}/busy.ics`,
    CALDAV_URL: `${CALDAV}/`,
    CALDAV_USERNAME: 'test',
    CALDAV_PASSWORD: 'test',
    CALENDAR_FEED_TOKEN: 'e2e-feed-token-0123456789',
    MEDIA_DIR: mkdtempSync(path.join(tmpdir(), 'mathex-media-')),
    TURNSTILE_SITE_KEY: '',
    TURNSTILE_SECRET_KEY: '',
  },
})
const stop = () => {
  child.kill('SIGTERM')
  radicale.kill('SIGTERM')
  smtp.close()
  process.exit(0)
}
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
child.on('exit', (code) => process.exit(code ?? 1))
