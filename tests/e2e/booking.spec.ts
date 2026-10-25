import { expect, test, type Page } from '@playwright/test'

import { asNewVisitor, busyDay, clearMail, getMail, waitForMail, waitLikeHuman } from './helpers'

const dayButtons = (page: Page) => page.locator('button[aria-pressed]')
const slotLabels = (page: Page) => page.locator('label:has(input[name="slot"])')

async function openBooking(page: Page) {
  await page.goto('/rezervace')
  await expect(dayButtons(page).first()).toBeVisible()
}

async function fillContact(page: Page, name: string, email: string) {
  await page.getByLabel('Jméno').fill(name)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel(/Firma/).fill('Instalatérství Test')
  await page.getByLabel(/Co byste chtěli probrat/).fill('Potřebuju nový web.')
  await page.getByRole('checkbox', { name: /Souhlasím/ }).check()
}

test.beforeEach(async ({ page }) => {
  await clearMail()
  await asNewVisitor(page)
})

test('termíny obsazené v Google Kalendáři se nenabízí', async ({ page }) => {
  await openBooking(page)
  const blocked = await busyDay()
  const [, month, day] = blocked.split('-').map(Number)
  const labels = await dayButtons(page).allTextContents()
  expect(labels.length).toBeGreaterThan(3)
  // Tlačítka dnů mají text např. „po 26. 10.16 volných“ – obsazený den mezi nimi být nesmí
  expect(labels.some((l) => l.includes(`${day}. ${month}.`))).toBe(false)
})

test('rezervace → potvrzení s pozvánkou → zrušení odkazem → e-mail o zrušení', async ({ page }) => {
  await openBooking(page)
  const slot = slotLabels(page).first()
  const slotTime = (await slot.textContent())!.trim()
  const slotIso = await slot.locator('input').getAttribute('value')
  await slot.click()
  await expect(page.getByText('Vybráno:')).toBeVisible()

  await fillContact(page, 'Petr Testovací', 'petr@example.com')
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click()

  await expect(page.getByText('Hotovo, máte zarezervováno')).toBeVisible()
  await expect(page.getByRole('status')).toContainText(slotTime)

  // --- e-maily: klient + majitel ---
  const mail = await waitForMail(2)
  const client = mail.find((m) => m.envelopeTo.includes('petr@example.com'))!
  const owner = mail.find((m) => !m.envelopeTo.includes('petr@example.com'))!
  expect(client, 'e-mail klientovi').toBeTruthy()
  expect(owner, 'e-mail majiteli').toBeTruthy()

  expect(client.subject).toMatch(/^Potvrzení konzultace/)
  expect(client.from).toContain('web@mathex.test')
  expect(client.text).toContain('Petr Testovací')
  expect(owner.subject).toMatch(/^Rezervace: Petr Testovací/)
  expect(owner.replyTo).toContain('petr@example.com')
  expect(owner.text).toContain('Instalatérství Test')

  // pozvánka do kalendáře
  const invite = client.attachments.find((a) => a.contentType.startsWith('text/calendar'))!
  expect(invite, 'příloha .ics').toBeTruthy()
  expect(invite.content).toContain('METHOD:REQUEST')
  const dt = new Date(slotIso!).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  expect(invite.content).toContain(`DTSTART:${dt}`)

  // --- obsazený termín už se nenabízí ---
  await openBooking(page)
  await expect(page.locator(`input[name="slot"][value="${slotIso}"]`)).toHaveCount(0)

  // --- zrušení odkazem z e-mailu ---
  const cancelUrl = client.html.match(/href="([^"]*\/rezervace\/zrusit\?token=[^"]+)"/)?.[1]
  expect(cancelUrl, 'odkaz na zrušení v e-mailu').toBeTruthy()
  await clearMail()
  await page.goto(new URL(cancelUrl!.replaceAll('&amp;', '&')).pathname + new URL(cancelUrl!.replaceAll('&amp;', '&')).search)
  await page.getByRole('button', { name: 'Zrušit rezervaci' }).click()
  await expect(page.getByRole('status')).toContainText('Rezervace je zrušená')

  const cancelMail = await waitForMail(2)
  const clientCancel = cancelMail.find((m) => m.envelopeTo.includes('petr@example.com'))!
  expect(clientCancel.subject).toMatch(/^Zrušení konzultace/)
  expect(clientCancel.attachments.find((a) => a.contentType.startsWith('text/calendar'))?.content).toContain('METHOD:CANCEL')

  // --- termín je zase volný ---
  await openBooking(page)
  await expect(page.locator(`input[name="slot"][value="${slotIso}"]`)).toHaveCount(1)

  // --- druhé zrušení stejným odkazem nic nerozbije ---
  await page.goto(new URL(cancelUrl!.replaceAll('&amp;', '&')).pathname + new URL(cancelUrl!.replaceAll('&amp;', '&')).search)
  await page.getByRole('button', { name: 'Zrušit rezervaci' }).click()
  await expect(page.getByRole('status')).toContainText('už byla zrušená')
})

test('dva lidé na stejný termín – druhý dostane srozumitelnou chybu', async ({ browser }) => {
  const a = await browser.newPage()
  const b = await browser.newPage()
  await asNewVisitor(a)
  await asNewVisitor(b)
  await openBooking(a)
  await openBooking(b)
  // stejný (druhý) termín v obou oknech
  const iso = await slotLabels(a).nth(1).locator('input').getAttribute('value')
  await a.locator(`label:has(input[value="${iso}"])`).click()
  await b.locator(`label:has(input[value="${iso}"])`).click()
  await fillContact(a, 'První Klient', 'prvni@example.com')
  await fillContact(b, 'Druhý Klient', 'druhy@example.com')
  await waitLikeHuman(a)

  await a.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(a.getByText('Hotovo, máte zarezervováno')).toBeVisible()

  await b.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(b.getByText('Tenhle termín mezitím někdo obsadil')).toBeVisible()
  // vyplněné údaje zůstaly
  await expect(b.getByLabel('Jméno')).toHaveValue('Druhý Klient')

  await waitForMail(2)
  await new Promise((r) => setTimeout(r, 1000))
  expect((await getMail()).some((m) => m.envelopeTo.includes('druhy@example.com'))).toBe(false)
  await a.close()
  await b.close()
})

test('neúplný formulář ukáže chyby a nic neodešle', async ({ page }) => {
  await openBooking(page)
  await slotLabels(page).first().click()
  await page.getByLabel('Jméno').fill('X')
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(page.getByText('Napište své jméno.')).toBeVisible()
  await expect(page.getByText(/Zkontrolujte e-mail/)).toBeVisible()
  await expect(page.getByText('Bez souhlasu nemůžu rezervaci uložit.')).toBeVisible()
  await page.waitForTimeout(1000)
  expect(await getMail()).toHaveLength(0)
})

test('telefonát vyžaduje telefonní číslo', async ({ page }) => {
  await openBooking(page)
  await page.getByRole('radio', { name: /Telefonát/ }).check()
  await expect(slotLabels(page).first()).toBeVisible()
  await slotLabels(page).first().click()
  await fillContact(page, 'Jana Test', 'jana@example.com')
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(page.getByText('U telefonátu potřebuju vaše číslo.')).toBeVisible()
})

test('robot (vyplněný honeypot) neprojde', async ({ page }) => {
  await openBooking(page)
  await slotLabels(page).first().click()
  await fillContact(page, 'Robot', 'robot@example.com')
  await page.locator('input[name="company_website"]').evaluate((el: HTMLInputElement) => (el.value = 'http://spam'))
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(page.getByText(/Formulář se nepodařilo odeslat/)).toBeVisible()
  expect(await getMail()).toHaveLength(0)
})

test('odběr rezervací do kalendáře chrání token', async ({ request }) => {
  expect((await request.get('/kalendar.ics')).status()).toBe(404)
  expect((await request.get('/kalendar.ics?token=spatny')).status()).toBe(404)
  const ok = await request.get('/kalendar.ics?token=e2e-feed-token-0123456789')
  expect(ok.status()).toBe(200)
  expect(ok.headers()['content-type']).toContain('text/calendar')
  const body = await ok.text()
  expect(body).toContain('BEGIN:VCALENDAR')
  expect(body).toContain('První Klient')
  expect(body).toContain('[ZRUŠENO]') // zrušená rezervace Petra
})
