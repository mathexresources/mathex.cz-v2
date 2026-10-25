import { expect, test } from '@playwright/test'

const PAGES = [
  '/',
  '/sluzby',
  '/sluzby/weby-na-miru',
  '/sluzby/prednasky-bezpecnost-na-internetu',
  '/portfolio',
  '/portfolio/bistro-na-rohu',
  '/cenik',
  '/o-mne',
  '/faq',
  '/kontakt',
  '/rezervace',
  '/blog',
  '/blog/co-musi-mit-web-firmy',
  '/blog/jak-poznat-podvodny-email',
  '/blog/kategorie/rady',
  '/ochrana-osobnich-udaju',
  '/cookies',
]

test('všechny stránky se načtou bez chyb, mají titulek, popis, canonical a jeden H1', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  for (const path of PAGES) {
    const res = await page.goto(path)
    expect(res?.status(), path).toBe(200)
    await expect(page, path).toHaveTitle(/.{10,}/)
    expect(await page.locator('meta[name="description"]').getAttribute('content'), path).toBeTruthy()
    expect(await page.locator('link[rel="canonical"]').getAttribute('href'), path).toMatch(/^http:\/\/localhost:\d+/)
    await expect(page.locator('h1'), path).toHaveCount(1)
  }
  expect(errors).toEqual([])
})

test('neexistující stránka vrací 404', async ({ page }) => {
  expect((await page.goto('/tohle-neexistuje'))?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('chybí')
})

test('strukturovaná data jsou platný JSON', async ({ page }) => {
  await page.goto('/')
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
    els.flatMap((el) => {
      const d = JSON.parse(el.textContent || 'null')
      return (Array.isArray(d) ? d : [d]).map((x) => x['@type'])
    }),
  )
  expect(types).toEqual(expect.arrayContaining(['ProfessionalService', 'WebSite', 'Person', 'FAQPage', 'OfferCatalog']))

  await page.goto('/blog/co-musi-mit-web-firmy')
  const article = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
    els.map((el) => JSON.parse(el.textContent || '{}')).filter((d) => d['@type'] === 'BlogPosting'),
  )
  expect(article[0].headline).toBe('Co musí mít web malé firmy, aby přiváděl zákazníky')
})

test('sitemap, robots, RSS a obrázek pro sdílení', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('/sluzby/prednasky-bezpecnost-na-internetu')
  expect(sitemap).toContain('/blog/jak-poznat-podvodny-email')

  // localhost se nesmí indexovat
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /')

  const rss = await request.get('/blog/rss.xml')
  expect(rss.headers()['content-type']).toContain('rss')
  expect(await rss.text()).toContain('<item>')

  const html = await (await request.get('/')).text()
  const og = html.match(/property="og:image" content="([^"]+)"/)?.[1]
  expect(og).toBeTruthy()
  const img = await request.get(new URL(og!).pathname)
  expect(img.headers()['content-type']).toBe('image/png')
})

test('www přesměruje na holou doménu (absolutní adresa, zachová cestu i parametry)', async ({ request }) => {
  // jako za Cloudflare tunelem: www.domena.cz přes HTTPS
  const res = await request.get('/cenik?x=1', {
    headers: { Host: 'www.example.cz', 'X-Forwarded-Proto': 'https' },
    maxRedirects: 0,
  })
  expect(res.status()).toBe(301)
  expect(res.headers()['location']).toBe('https://example.cz/cenik?x=1')

  // Tunel někdy nepošle X-Forwarded-Proto – i pak musí zůstat https
  const noProto = await request.get('/blog', { headers: { Host: 'www.example.cz', 'X-Forwarded-Proto': '' }, maxRedirects: 0 })
  expect(noProto.status()).toBe(301)
  expect(noProto.headers()['location']).toMatch(/^https?:\/\/example\.cz\/blog$/)

  // holá doména se nepřesměrovává
  expect((await request.get('/cenik', { maxRedirects: 0 })).status()).toBe(200)
})

test('bezpečnostní hlavičky', async ({ request }) => {
  const h = (await request.get('/')).headers()
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['x-frame-options']).toBe('SAMEORIGIN')
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['x-powered-by']).toBeUndefined()
})

test('mobil: lepicí lišta se Zavolat a Rezervovat', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Zavolat' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Rezervovat konzultaci', exact: true }).last()).toBeVisible()
  await page.close()
})

test('přednášky: stránka, ceník podle domluvy a předvyplněná poptávka', async ({ page }) => {
  await page.goto('/sluzby/prednasky-bezpecnost-na-internetu')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('phishingu a OSINT')
  await expect(page.getByText('OSINT – co o vás ví internet')).toBeVisible()
  await expect(page.getByText('Délka i cena jsou podle domluvy').first()).toBeVisible()

  await page.getByRole('link', { name: 'Domluvit přednášku' }).first().click()
  await expect(page).toHaveURL(/\/kontakt\?tema=prednaska/)
  await expect(page.getByLabel(/Co potřebujete/)).toHaveValue(/přednášku o bezpečnosti/)

  await page.goto('/cenik')
  await expect(page.getByRole('heading', { name: 'Přednášky o bezpečnosti' })).toBeVisible()

  // Na stránce webů tlačítko na přednášku není
  await page.goto('/sluzby/weby-na-miru')
  await expect(page.getByRole('link', { name: 'Domluvit přednášku' })).toHaveCount(0)
})
