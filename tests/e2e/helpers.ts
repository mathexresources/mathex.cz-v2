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
