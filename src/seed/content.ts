/**
 * Výchozí obsah webu (texty, služby, ceník, FAQ, ukázkové projekty, blog, právní stránky).
 * Spouští se automaticky při prvním startu s prázdnou databází (viz payload.config.ts),
 * nebo ručně přes `npm run seed`.
 */
import type { Payload } from 'payload'

import {
  ABOUT,
  GENERAL_WEB_POST,
  HOME,
  LECTURE_FAQS,
  LECTURE_SERVICE,
  SECURITY_CATEGORY,
  SECURITY_POST,
  SITE,
  WEB_SECURITY_FAQ,
  WEB_SERVICE,
} from './defaults'
import { rt } from './richtext'

export async function seedIfEmpty(payload: Payload): Promise<boolean> {
  const already = await payload.count({ collection: 'services' })
  if (already.totalDocs > 0) return false
  await seedContent(payload)
  return true
}

type ServiceDefaults = {
  title: string
  slug: string
  segment: 'weby' | 'bezpecnost'
  order: number
  headline: string
  intro: string
  shortDescription: string
  painPoints: string[]
  features: { title: string; text: string }[]
}

export const serviceData = (d: ServiceDefaults) => ({
  title: d.title,
  slug: d.slug,
  segment: d.segment,
  order: d.order,
  headline: d.headline,
  intro: d.intro,
  shortDescription: d.shortDescription,
  painPoints: d.painPoints.map((text) => ({ text })),
  features: d.features,
})

export async function seedContent(payload: Payload) {
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  // ---------- Globální nastavení ----------
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      brandName: 'Mathex',
      tagline: SITE.tagline,
      defaultDescription: SITE.defaultDescription,
      ownerName: 'Jméno Příjmení',
      ico: '00000000',
      vatPayer: false,
      city: 'Praha',
      registry: 'Fyzická osoba zapsaná v živnostenském rejstříku.',
      email: 'ahoj@mathex.cz',
      phone: '+420 000 000 000',
      serviceArea: 'Praha a okolí, online celá ČR',
      socials: [],
    },
  })

  await payload.updateGlobal({
    slug: 'home-page',
    data: {
      heroTitle: HOME.heroTitle,
      heroText: HOME.heroText,
      process: [
        {
          title: 'Konzultace',
          text: 'Za 30 minut probereme, co děláte, pro koho je web a co má umět. Pošlu vám pevnou cenu a termín.',
          duration: 'Zdarma, 30 minut',
        },
        {
          title: 'Návrh',
          text: 'Připravím návrh úvodní stránky. Upravujeme, dokud nesedí. Teprve potom platíte zálohu.',
          duration: '2–4 dny',
        },
        {
          title: 'Realizace',
          text: 'Naprogramuju celý web, napojím formuláře, Google a analytiku. Průběžně uvidíte, jak web roste.',
          duration: '5–10 dní',
        },
        {
          title: 'Spuštění',
          text: 'Web pustíme ven, ukážu vám administraci a měsíc ladím drobnosti zdarma.',
          duration: '1 den',
        },
      ],
      closingTitle: HOME.closingTitle,
      closingText: HOME.closingText,
    },
  })

  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      headline: ABOUT.headline,
      body: ABOUT.body(),
      facts: [
        { label: 'Sídlo', value: 'Praha' },
        { label: 'Weby od roku', value: '20XX' },
        { label: 'Odpovídám do', value: '1 pracovního dne' },
      ],
      principles: [
        { title: 'Pevná cena předem', text: 'Cenu znáte dřív, než cokoli zaplatíte. Žádné hodinovky, žádná překvapení na faktuře.' },
        { title: 'Všechno patří vám', text: 'Doména, hosting i zdrojový kód jsou na vaše jméno. Kdykoli můžete odejít jinam.' },
        { title: 'Mluvím česky, ne technicky', text: 'Vysvětlím, co a proč dělám, bez zkratek a žargonu.' },
        { title: 'Rychlost jako standard', text: 'Každý web musí mít na mobilu v Google PageSpeed aspoň 90 bodů. Jinak ho nepředám.' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'booking-settings',
    data: {
      enabled: true,
      meetingTypes: [
        { label: 'Online videohovor', kind: 'online', durationMin: 30, description: 'Google Meet, odkaz přijde v potvrzení.' },
        { label: 'Telefonát', kind: 'phone', durationMin: 20, description: 'Zavolám vám na zadané číslo.' },
      ],
      workingHours: ['1', '2', '3', '4', '5'].map((day) => ({
        day: day as '1' | '2' | '3' | '4' | '5',
        from: '09:00',
        to: '17:00',
      })),
      slotStepMin: 30,
      bufferMin: 15,
      minNoticeHours: 12,
      maxDaysAhead: 30,
      maxPerDay: 4,
      blackouts: [],
    },
  })
  log('Globální nastavení hotové')

  // ---------- FAQ ----------
  const faqData = [
    { topic: 'cena', question: 'Kolik stojí web na míru?', answer: 'Jednoduchá vizitka začíná na 14 900 Kč, firemní web s administrací a blogem na 29 900 Kč. Přesnou cenu dostanete po úvodní konzultaci a už se nemění.' },
    { topic: 'cena', question: 'Jak probíhá platba?', answer: '50 % zálohy platíte po odsouhlasení návrhu, zbytek při spuštění webu. Fakturuji jako fyzická osoba.' },
    { topic: 'cena', question: 'Platím něco měsíčně?', answer: 'Jen hosting a doménu, obvykle 100–300 Kč měsíčně podle poskytovatele. Pokud chcete, abych se o web staral (aktualizace, zálohy, drobné úpravy), domluvíme měsíční paušál.' },
    { topic: 'prubeh', question: 'Jak dlouho trvá výroba webu?', answer: 'Vizitka do týdne, firemní web do dvou týdnů od dodání podkladů. Termín vám řeknu na konzultaci a dodržím ho.' },
    { topic: 'prubeh', question: 'Co od vás budu potřebovat?', answer: 'Logo (pokud máte), fotky vaší práce nebo provozovny, kontaktní údaje a představu, co má web říct. S texty vám pomůžu.' },
    { topic: 'prubeh', question: 'Nemám fotky ani texty. Vadí to?', answer: 'Nevadí. Texty napíšu podle krátkého rozhovoru s vámi a fotky doporučím fotografa nebo použijeme kvalitní ilustrační.' },
    { topic: 'technika', question: 'Komu patří web a doména?', answer: 'Vám. Doména i hosting jsou na vaše jméno a zdrojový kód dostanete. Nic vám nedržím jako rukojmí.' },
    { topic: 'technika', question: 'Budu si moct web upravovat sám?', answer: 'Ano. Texty, fotky, ceník, články nebo menu si změníte v jednoduché administraci. Na spuštění vám ji ukážu.' },
    { topic: 'technika', question: 'Bude web vidět na Googlu?', answer: 'Každý web má technické SEO v základu: rychlost, strukturovaná data, sitemapu a správné nadpisy. Pomůžu vám i se založením Google Business Profile, který je pro místní firmy nejdůležitější.' },
    WEB_SECURITY_FAQ,
    { topic: 'technika', question: 'Děláte i e-shopy?', answer: 'Zatím se soustředím na prezentační weby, rezervace a poptávkové formuláře. Web ale stavím tak, aby se k němu dal e-shop později přidat.' },
    ...LECTURE_FAQS,
  ] as const

  const faqIds: Record<string, number> = {}
  for (const [i, f] of faqData.entries()) {
    const doc = await payload.create({ collection: 'faqs', data: { ...f, order: i, showOnFaqPage: true } })
    faqIds[f.question] = doc.id
  }
  const faqsFor = (...questions: string[]) => questions.map((q) => faqIds[q]).filter(Boolean)
  log('FAQ hotové')

  // ---------- Služby ----------
  const webService = await payload.create({
    collection: 'services',
    data: {
      ...serviceData(WEB_SERVICE),
      faqs: faqsFor(...WEB_SERVICE.faqQuestions),
    },
  })
  await payload.create({
    collection: 'services',
    data: {
      ...serviceData(LECTURE_SERVICE),
      body: LECTURE_SERVICE.body(),
      faqs: faqsFor(...LECTURE_SERVICE.faqQuestions),
    },
  })
  log('Služby hotové')

  // ---------- Ceník ----------
  await payload.create({
    collection: 'packages',
    data: {
      name: 'Vizitka',
      category: 'web',
      price: 14900,
      priceFrom: true,
      deliveryDays: 7,
      order: 1,
      description: 'Jedna stránka se vším podstatným. Pro začínající živnostníky a ty, kdo zatím web nemají.',
      features: [
        { text: 'Jednostránkový web na míru' },
        { text: 'Kontaktní formulář' },
        { text: 'Napojení na Google Business Profile' },
        { text: 'Základní SEO a rychlost 90+' },
      ],
    },
  })
  await payload.create({
    collection: 'packages',
    data: {
      name: 'Firemní web',
      category: 'web',
      price: 29900,
      priceFrom: true,
      deliveryDays: 14,
      order: 2,
      highlighted: true,
      description: 'Plnohodnotný web s administrací. Pro firmy, které chtějí získávat zákazníky z Googlu.',
      features: [
        { text: 'Až 8 stránek (služby, reference, o nás…)' },
        { text: 'Administrace pro úpravy textů a fotek' },
        { text: 'Blog nebo novinky' },
        { text: 'Galerie realizací' },
        { text: 'Místní SEO a strukturovaná data' },
        { text: 'Analytika bez cookie lišty' },
      ],
    },
  })
  await payload.create({
    collection: 'packages',
    data: {
      name: 'Web s rezervacemi',
      category: 'web',
      price: 44900,
      priceFrom: true,
      deliveryDays: 21,
      order: 3,
      description: 'Všechno z Firemního webu a navíc online rezervace termínů nebo stolů.',
      features: [
        { text: 'Vše z balíčku Firemní web' },
        { text: 'Rezervace s výběrem volného času' },
        { text: 'Potvrzení a pozvánka do kalendáře e-mailem' },
        { text: 'Synchronizace s Google Kalendářem' },
        { text: 'Přehled rezervací v administraci' },
      ],
    },
  })
  log('Ceník hotový')

  // ---------- Ukázkové projekty ----------
  const demos = [
    {
      title: 'Web truhlářské dílny s galerií realizací',
      client: 'Truhlářství Dvořák',
      segment: 'remeslnici',
      slug: 'truhlarstvi-dvorak',
      summary: 'Kuchyně a vestavěné skříně na míru. Galerie podle typu zakázky a poptávka s přiložením fotky prostoru.',
      stack: ['Galerie realizací', 'Poptávkový formulář s fotkou', 'Stránky pro 4 okresy'],
    },
    {
      title: 'Bistro s denním menu a rezervací stolů',
      client: 'Bistro Na Rohu',
      segment: 'gastro',
      slug: 'bistro-na-rohu',
      summary: 'Denní menu, které majitelka mění z mobilu, rezervace stolů a otevírací doba propojená s Googlem.',
      stack: ['Denní menu z administrace', 'Rezervace stolů', 'Strukturovaná data Restaurant'],
    },
    {
      title: 'Kadeřnictví s online rezervací termínů',
      client: 'Studio Linie',
      segment: 'sluzby',
      slug: 'studio-linie',
      summary: 'Klientky si vyberou službu, kadeřnici a volný čas. Telefon zvoní o polovinu méně.',
      stack: ['Rezervace podle kadeřnice', 'Ceník služeb', 'Dárkové poukazy'],
    },
  ] as const

  for (const [i, d] of demos.entries()) {
    await payload.create({
      collection: 'projects',
      data: {
        title: d.title,
        client: d.client,
        segment: d.segment,
        slug: d.slug,
        summary: d.summary,
        isDemo: true,
        featured: true,
        order: i + 1,
        stack: d.stack.map((item) => ({ item })),
        challenge: rt('Ukázkový projekt. Sem napište, s čím klient přišel a co ho trápilo.'),
        solution: rt('Popište, co jste navrhli a proč. Ideálně s konkrétními rozhodnutími.'),
        result: rt('Výsledek v číslech: rychlost, počet poptávek, pozice na Googlu.'),
      },
    })
  }
  log('Ukázkové projekty hotové (nahraj k nim screenshoty)')

  // ---------- Blog ----------
  const catTips = await payload.create({
    collection: 'categories',
    data: { title: 'Rady pro podnikatele', slug: 'rady', description: 'Praktické rady, jak získat zákazníky přes web a Google.' },
  })
  const catSecurity = await payload.create({ collection: 'categories', data: SECURITY_CATEGORY })
  await payload.create({
    collection: 'categories',
    data: { title: 'Ceny a rozpočet', slug: 'ceny', description: 'Kolik co stojí a za co se vyplatí zaplatit.' },
  })

  const admin = (await payload.find({ collection: 'users', limit: 1 })).docs[0]

  await payload.create({
    collection: 'posts',
    data: {
      title: SECURITY_POST.title,
      slug: SECURITY_POST.slug,
      excerpt: SECURITY_POST.excerpt,
      category: catSecurity.id,
      author: admin?.id,
      _status: 'published',
      publishedAt: new Date().toISOString(),
      content: SECURITY_POST.content(),
    },
  })

  await payload.create({
    collection: 'posts',
    data: {
      title: GENERAL_WEB_POST.title,
      slug: GENERAL_WEB_POST.slug,
      excerpt: GENERAL_WEB_POST.excerpt,
      category: catTips.id,
      author: admin?.id,
      relatedService: webService.id,
      _status: 'published',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      content: GENERAL_WEB_POST.content(),
    },
  })

  await payload.create({
    collection: 'posts',
    data: {
      title: 'Web na míru, nebo stavebnice? Srovnání pro malou firmu',
      relatedService: webService.id,
      slug: 'web-na-miru-nebo-stavebnice',
      excerpt: 'Kdy dává smysl Wix nebo Webnode a kdy se vyplatí zaplatit za web na míru. Srovnání ceny za pět let.',
      category: catTips.id,
      author: admin?.id,
      _status: 'published',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      content: rt(`
  Stavebnice slibují web za odpoledne a pár stovek měsíčně. Pro někoho je to opravdu nejlepší volba. Pro firmu, která chce získávat zákazníky z Googlu, ale většinou ne.

  ## Kdy stačí stavebnice

  - Potřebujete web jen na pár měsíců (akce, sezónní projekt).
  - Nemáte rozpočet ani na základní web na míru.
  - Zákazníci k vám chodí jen přes doporučení a web je jen vizitka.

  ## Kdy se vyplatí web na míru

  - Chcete, aby vás lidé našli na Googlu.
  - Záleží vám na tom, jak rychle se web načte na mobilu.
  - Chcete web, který nevypadá jako tisíc dalších.
  - Nechcete platit každý měsíc za něco, co vám nepatří.

  ## Kolik to stojí za pět let

  Placený tarif stavebnice vyjde zhruba na 300–600 Kč měsíčně, tedy 18 000–36 000 Kč za pět let. Web vám přitom nikdy nepatří a když přestanete platit, zmizí. Web na míru zaplatíte jednou a pak už jen hosting za pár stovek ročně.

  Pokud si nejste jistí, co se vám vyplatí, rezervujte si konzultaci zdarma. Řeknu vám to upřímně, i když to bude stavebnice.
      `),
    },
  })
  log('Blog hotový')

  // ---------- Právní stránky ----------
  await payload.create({
    collection: 'pages',
    data: {
      title: 'Zásady ochrany osobních údajů',
      slug: 'ochrana-osobnich-udaju',
      intro: 'Jak zacházím s údaji, které mi pošlete přes formulář nebo rezervaci.',
      _status: 'published',
      showInFooter: true,
      content: rt(`
  Tento text je návrh. Před spuštěním webu ho prosím nechte zkontrolovat a doplňte své údaje.

  ## Kdo údaje zpracovává

  Správcem osobních údajů je [jméno a příjmení], IČO [IČO], se sídlem [adresa], e-mail [e-mail].

  ## Jaké údaje zpracovávám a proč

  - Kontaktní formulář: jméno, e-mail, případně telefon, firma a obsah zprávy. Účelem je odpovědět na váš dotaz a připravit nabídku. Právním základem je jednání o smlouvě na vaši žádost.
  - Rezervace konzultace: jméno, e-mail, telefon, firma, obor, odkaz na web a poznámka. Účelem je domluvit a uskutečnit schůzku.
  - Pokud se stanete klientem, údaje potřebné k plnění smlouvy a vystavení faktur.

  ## Jak dlouho údaje uchovávám

  Údaje z poptávek a rezervací, ze kterých nevznikla spolupráce, mažu nejpozději do 12 měsíců. Účetní doklady uchovávám po dobu stanovenou zákonem.

  ## Komu údaje předávám

  Údaje nikomu neprodávám. Mohou k nim mít přístup jen zpracovatelé, kteří mi pomáhají provozovat web: poskytovatel hostingu [název] a poskytovatel e-mailových služeb [název].

  ## Analytika

  Web používá analytiku, která neukládá cookies a neshromažďuje osobní údaje. Návštěvy se počítají anonymně.

  ## Vaše práva

  Máte právo na přístup ke svým údajům, jejich opravu nebo výmaz, omezení zpracování, přenositelnost a právo vznést námitku. Stačí napsat na [e-mail]. Pokud nebudete spokojeni, můžete se obrátit na Úřad pro ochranu osobních údajů (uoou.gov.cz).
      `),
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      title: 'Cookies',
      slug: 'cookies',
      intro: 'Tento web nepoužívá reklamní ani sledovací cookies.',
      _status: 'published',
      showInFooter: true,
      content: rt(`
  Proto po vás nechci souhlas přes cookie lištu.

  ## Co web používá

  - Analytika návštěvnosti, která funguje bez cookies a bez ukládání osobních údajů.
  - Technické cookies pouze v administraci webu, a to jen pro přihlášeného správce.

  Pokud se to někdy změní, dozvíte se to tady a web si o souhlas řekne dřív, než cokoli uloží.
      `),
    },
  })
  log('Právní stránky hotové (doplň v nich své údaje)')

  log('Výchozí obsah je nahraný. Přihlas se na /admin')
}
