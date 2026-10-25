import { expect, type Page } from '@playwright/test'

const HELPER = 'http://127.0.0.1:2526'

export type Mail = {
  envelopeTo: string[]
  from?: string
  to?: string
  replyTo?: string
  subject?: string
  text?: string
  html: string
  attachments: { filename?: string; contentType: string; content: string }[]
}

export async function clearMail() {
  await fetch(`${HELPER}/messages`, { method: 'DELETE' })
}

export async function getMail(): Promise<Mail[]> {
  return (await fetch(`${HELPER}/messages`)).json()
}

/** Počká, až dorazí aspoň `count` e-mailů. */
export async function waitForMail(count: number): Promise<Mail[]> {
  let mail: Mail[] = []
  await expect
    .poll(
      async () => {
        mail = await getMail()
        return mail.length
      },
      { timeout: 15_000, message: `čekám na ${count} e-mail(y)` },
    )
    .toBeGreaterThanOrEqual(count)
  return mail
}

export async function busyDay(): Promise<string> {
  return (await fetch(`${HELPER}/busy-day`)).text()
}

/** Formuláře odmítnou odeslání rychlejší než 2,5 s (ochrana proti robotům). */
export async function waitLikeHuman(page: Page) {
  await page.waitForTimeout(2700)
}

let ipCounter = 0
/** Každý test se tváří jako jiný návštěvník (Cloudflare posílá jeho IP v CF-Connecting-IP). */
export async function asNewVisitor(page: Page) {
  ipCounter++
  await page.setExtraHTTPHeaders({ 'cf-connecting-ip': `203.0.113.${(ipCounter % 250) + 1}-${Date.now()}` })
}

export const ADMIN = { email: 'admin@mathex.test', password: 'E2e-Heslo-123456', name: 'Test Admin' }

/** Přihlásí administrátora (a při prvním volání ho založí). Vrací JWT token. */
export async function adminToken(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const login = await request.post('/api/users/login', { data: { email: ADMIN.email, password: ADMIN.password } })
  if (login.ok()) return (await login.json()).token
  const reg = await request.post('/api/users/first-register', { data: ADMIN })
  if (!reg.ok()) throw new Error(`Nepodařilo se založit administrátora: ${await reg.text()}`)
  const again = await request.post('/api/users/login', { data: { email: ADMIN.email, password: ADMIN.password } })
  return (await again.json()).token
}

export async function calendarDays(): Promise<{ workDay: string; privateDay: string; weeklyDay: string; onceDay: string }> {
  return (await fetch(`${HELPER}/calendar-days`)).json()
}

/** Obsah kalendáře v testovacím CalDAV serveru (Radicale). */
export async function caldavCalendar(slug: string): Promise<string> {
  return (await fetch(`${HELPER}/caldav/${slug}`)).text()
}
