import { expect, test } from '@playwright/test'

import { ADMIN, adminToken, asNewVisitor, clearMail, getMail, waitForMail, waitLikeHuman } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearMail()
  await asNewVisitor(page)
})

test('kontaktní formulář uloží poptávku a pošle dva e-maily', async ({ page }) => {
  await page.goto('/kontakt')
  await page.getByLabel('Jméno').fill('Jana Nováková')
  await page.getByLabel('E-mail').fill('jana@example.com')
  await page.getByLabel(/Představa o rozpočtu/).fill('do 30 000 Kč')
  await page.getByLabel(/Co potřebujete/).fill('Web pro kavárnu s denním menu.')
  await page.getByRole('checkbox', { name: /Souhlasím/ }).check()
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Odeslat zprávu' }).click()
  await expect(page.getByText('Zpráva odeslaná')).toBeVisible()

  const mail = await waitForMail(2)
  const owner = mail.find((m) => m.subject?.startsWith('Poptávka:'))!
  const client = mail.find((m) => m.envelopeTo.includes('jana@example.com'))!
  expect(owner.replyTo).toContain('jana@example.com')
  expect(owner.text).toContain('Web pro kavárnu s denním menu.')
  expect(owner.text).toContain('do 30 000 Kč')
  expect(client.subject).toMatch(/^Vaše zpráva pro/)
})

test('neúplný kontaktní formulář zachová vyplněný text', async ({ page }) => {
  await page.goto('/kontakt')
  await page.getByLabel(/Co potřebujete/).fill('Dlouhý text, o který nechci přijít.')
  await waitLikeHuman(page)
  await page.getByRole('button', { name: 'Odeslat zprávu' }).click()
  await expect(page.getByText('Napište své jméno.')).toBeVisible()
  await expect(page.getByLabel(/Co potřebujete/)).toHaveValue('Dlouhý text, o který nechci přijít.')
  expect(await getMail()).toHaveLength(0)
})

test('limit: šestá zpráva z jedné adresy během hodiny neprojde', async ({ page }) => {
  await page.goto('/kontakt')
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: 'Odeslat zprávu' }).click()
    await expect(page.locator('form p[role="alert"]')).toBeVisible()
  }
  await expect(page.locator('form p[role="alert"]')).toContainText('moc zpráv')
  expect(await getMail()).toHaveLength(0)
})

test.describe('administrace', () => {
  test('první účet, kontrola služeb a zkušební e-mail', async ({ page, request }) => {
    // Kontrola služeb není veřejná
    expect((await request.get('/api/diagnostika')).status()).toBe(401)
    expect((await request.post('/api/diagnostika/test-email')).status()).toBe(401)

    // Založení prvního účtu (stejně jako po instalaci na serveru), případně přihlášení
    await adminToken(request)

    await page.goto('/admin/login')
    await page.locator('input[name="email"]').fill(ADMIN.email)
    await page.locator('input[name="password"]').fill(ADMIN.password)
    await page.locator('button[type="submit"]').click()

    const panel = page.getByTestId('service-check')
    await expect(panel).toBeVisible({ timeout: 30_000 })
    await expect(panel).not.toContainText('kontroluji')
    // otevřít detail
    if (!(await panel.locator('[data-check="smtp"]').isVisible())) await panel.getByRole('button', { name: /Kontrola služeb/ }).click()

    await expect(panel.locator('[data-check="smtp"]')).toHaveAttribute('data-status', 'ok')
    await expect(panel.locator('[data-check="calendar"]')).toHaveAttribute('data-status', 'ok')
    await expect(panel.locator('[data-check="calendar"]')).toContainText('1 obsazených bloků')
    await expect(panel.locator('[data-check="caldav"]')).toContainText('Práce')
    await expect(panel.getByTestId('webcal-link')).toHaveAttribute('href', /^webcal:\/\/localhost:\d+\/kalendar\.ics\?token=/)
    await expect(panel.locator('[data-check="feed"]')).toHaveAttribute('data-status', 'ok')
    await expect(panel).toContainText('/kalendar.ics?token=e2e-feed-token-0123456789')
    await expect(panel.locator('[data-check="turnstile"]')).toHaveAttribute('data-status', 'off')

    await panel.getByLabel('Poslat zkušební e-mail na').fill('kontrola@example.com')
    await panel.getByRole('button', { name: 'Odeslat' }).click()
    await expect(panel.getByRole('status')).toContainText('Odesláno na kontrola@example.com')
    const mail = await waitForMail(1)
    expect(mail[0].envelopeTo).toContain('kontrola@example.com')
    expect(mail[0].subject).toMatch(/^Zkušební e-mail/)
  })

  test('rezervace a poptávky jsou v administraci vidět', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('input[name="email"]').fill(ADMIN.email)
    await page.locator('input[name="password"]').fill(ADMIN.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/admin$/)

    await page.goto('/admin/collections/bookings')
    await expect(page.getByText('Petr Testovací')).toBeVisible()
    await page.goto('/admin/collections/inquiries')
    await expect(page.getByText('Jana Nováková')).toBeVisible()
  })

  test('úprava v administraci se hned projeví na webu', async ({ page, request }) => {
    const login = await request.post('/api/users/login', { data: { email: ADMIN.email, password: ADMIN.password } })
    const { token } = await login.json()
    const res = await request.post('/api/globals/home-page', {
      headers: { Authorization: `JWT ${token}` },
      data: { heroTitle: 'Nadpis změněný v testu' },
    })
    expect(res.ok()).toBe(true)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nadpis změněný v testu')
  })
})
