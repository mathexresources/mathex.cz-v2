import { expect, test, type Page } from '@playwright/test'

import { adminToken, asNewVisitor, caldavCalendar, calendarDays, clearMail, waitForMail, waitLikeHuman } from './helpers'

/** Tlačítko dne v rezervacích, např. „st 28. 10.“ (přesně, aby „8. 10.“ nechytlo „28. 10.“). */
const dayButton = (page: Page, key: string) => {
  const [, m, d] = key.split('-').map(Number)
  return page.locator('button[aria-pressed]', { hasText: new RegExp(`(^|\\s)${d}\\. ${m}\\.`) })
}

const pragueKey = (dt: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(dt)

/** Začátky slotů daného dne jako „HH:MM“ v pražském čase ([] když se den vůbec nenabízí). */
async function slotTimes(page: Page, key: string): Promise<string[]> {
  await page.goto('/rezervace')
  await page.locator('button[aria-pressed]').first().waitFor()
  const btn = dayButton(page, key)
  if ((await btn.count()) === 0) return []
  await btn.first().click()
  await expect(btn.first()).toHaveAttribute('aria-pressed', 'true')
  const values = await page.locator('input[name="slot"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
  return values
    .map((v) => new Date(v))
    .filter((dt) => pragueKey(dt) === key)
    .map((dt) => new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit' }).format(dt))
}

const weekdayOf = (key: string) => String(new Date(`${key}T12:00:00Z`).getUTCDay())

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page }) => {
  await clearMail()
  await asNewVisitor(page)
})

test('nastavení kalendářů a blokací v administraci', async ({ request }) => {
  const days = await calendarDays()
  const token = await adminToken(request)
  const res = await request.post('/api/globals/booking-settings', {
    headers: { Authorization: `JWT ${token}` },
    data: {
      calendar: { busyCalendars: 'Práce, Rezervace', bookingCalendar: 'Rezervace' },
      blockedTimes: [
        { repeat: 'weekly', day: weekdayOf(days.weeklyDay), from: '09:00', to: '11:00', note: 'Trénink' },
        { repeat: 'once', date: `${days.onceDay}T10:00:00.000Z`, from: '13:00', to: '17:00', note: 'Lékař' },
      ],
    },
  })
  expect(res.ok(), await res.text()).toBe(true)

  // Nastavení rezervací už není veřejně čitelné přes API
  const anon = await request.get('/api/globals/booking-settings', { headers: { Authorization: '' } })
  expect(JSON.stringify(await anon.json())).not.toContain('Trénink')
})

test('událost v kalendáři „Práce“ blokuje termíny, „Soukromé“ (nevybraný) ne', async ({ page }) => {
  const { workDay, privateDay } = await calendarDays()
  const work = await slotTimes(page, workDay)
  expect(work.length).toBeGreaterThan(0)
  expect(work.every((t) => t >= '12:00'), `sloty ${workDay}: ${work.join(', ')}`).toBe(true)

  const priv = await slotTimes(page, privateDay)
  expect(priv).toContain('09:00')
})

test('týdenní a jednorázová blokace z administrace', async ({ page }) => {
  const { weeklyDay, onceDay } = await calendarDays()
  const weekly = await slotTimes(page, weeklyDay)
  expect(weekly.length).toBeGreaterThan(0)
  expect(weekly.every((t) => t >= '11:00'), `sloty ${weeklyDay}: ${weekly.join(', ')}`).toBe(true)

  const once = await slotTimes(page, onceDay)
  expect(once).toContain('09:00')
  expect(once.every((t) => t < '13:00' || t >= '17:00'), `sloty ${onceDay}: ${once.join(', ')}`).toBe(true)
})

test('rezervace se zapíše do kalendáře v iPhonu a po zrušení z něj zmizí', async ({ page }) => {
  const { privateDay } = await calendarDays()
  await page.goto('/rezervace')
  await dayButton(page, privateDay).first().click()
  const slot = page.locator('label:has(input[name="slot"])').first()
  const iso = await slot.locator('input').getAttribute('value')
  await slot.click()
  await page.getByLabel('Jméno').fill('Klára Kalendářová')
  await page.getByLabel('E-mail').fill('klara@example.com')
  await page.getByRole('checkbox', { name: /Souhlasím/ }).check()
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(page.getByText('Hotovo, máte zarezervováno')).toBeVisible()

  // Událost je v kalendáři „Rezervace“ – bez pozvánky klientovi (žádný ATTENDEE/METHOD)
  await expect.poll(() => caldavCalendar('rezervace'), { timeout: 10_000 }).toContain('Klára Kalendářová')
  const cal = await caldavCalendar('rezervace')
  expect(cal).toContain('klara@example.com')
  expect(cal).not.toContain('ATTENDEE')
  expect(cal).not.toMatch(/^METHOD:/m)
  const dt = new Date(iso!).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  expect(cal).toContain(`DTSTART:${dt}`)

  // Obsazený termín se nenabízí (rezervace i událost v kalendáři)
  await page.goto('/rezervace')
  await expect(page.locator(`input[name="slot"][value="${iso}"]`)).toHaveCount(0)

  // Zrušení odkazem z e-mailu → událost zmizí z kalendáře a termín je volný
  const mail = await waitForMail(2)
  const client = mail.find((x) => x.envelopeTo.includes('klara@example.com'))!
  const cancel = new URL(client.html.match(/href="([^"]*\/rezervace\/zrusit\?token=[^"]+)"/)![1].replaceAll('&amp;', '&'))
  await page.goto(cancel.pathname + cancel.search)
  await page.getByRole('button', { name: 'Zrušit rezervaci' }).click()
  await expect(page.getByRole('status')).toContainText('Rezervace je zrušená')
  await expect.poll(() => caldavCalendar('rezervace'), { timeout: 10_000 }).not.toContain('Klára Kalendářová')

  await page.goto('/rezervace')
  await dayButton(page, privateDay).first().click()
  await expect(page.locator(`input[name="slot"][value="${iso}"]`)).toHaveCount(1)
})

test('rezervace zrušená v administraci zmizí z kalendáře', async ({ page, request }) => {
  const { privateDay } = await calendarDays()
  await page.goto('/rezervace')
  await dayButton(page, privateDay).first().click()
  await page.locator('label:has(input[name="slot"])').nth(2).click()
  await page.getByLabel('Jméno').fill('Admin Zrušení')
  await page.getByLabel('E-mail').fill('admin-cancel@example.com')
  await page.getByRole('checkbox', { name: /Souhlasím/ }).check()
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click()
  await expect(page.getByText('Hotovo, máte zarezervováno')).toBeVisible()
  await expect.poll(() => caldavCalendar('rezervace')).toContain('Admin Zrušení')

  const token = await adminToken(request)
  const list = await request.get('/api/bookings?where[email][equals]=admin-cancel@example.com', {
    headers: { Authorization: `JWT ${token}` },
  })
  const booking = (await list.json()).docs[0]
  expect(booking.calendarEventUrl).toContain('/rezervace/')
  await clearMail()
  const upd = await request.patch(`/api/bookings/${booking.id}`, {
    headers: { Authorization: `JWT ${token}` },
    data: { status: 'cancelled' },
  })
  expect(upd.ok()).toBe(true)
  await expect.poll(() => caldavCalendar('rezervace')).not.toContain('Admin Zrušení')
  // klient dostane e-mail o zrušení
  const mail = await waitForMail(1)
  expect(mail.some((x) => x.envelopeTo.includes('admin-cancel@example.com') && /Zrušení/.test(x.subject ?? ''))).toBe(true)
})
