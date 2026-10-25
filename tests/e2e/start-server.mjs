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
import { existsSync, mkdtempSync } from 'node:fs'
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
    res.statusCode = 404
    res.end()
  })
  .listen(HELPER_PORT, '127.0.0.1')

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
    CALENDAR_FEED_TOKEN: 'e2e-feed-token-0123456789',
    MEDIA_DIR: mkdtempSync(path.join(tmpdir(), 'mathex-media-')),
    TURNSTILE_SITE_KEY: '',
    TURNSTILE_SECRET_KEY: '',
  },
})
const stop = () => {
  child.kill('SIGTERM')
  smtp.close()
  process.exit(0)
}
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
child.on('exit', (code) => process.exit(code ?? 1))
