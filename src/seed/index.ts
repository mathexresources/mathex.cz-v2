/**
 * Naplní prázdnou databázi výchozím obsahem.
 * Spuštění:  ADMIN_EMAIL=ty@domena.cz ADMIN_PASSWORD=... npm run seed
 * V Dockeru: docker compose exec web node ... (viz README)
 *
 * Skript je bezpečné pustit opakovaně – když už obsah existuje, nic nepřepíše.
 */
import { randomBytes } from 'crypto'

import config from '@payload-config'
import { getPayload } from 'payload'

import { rt } from './richtext'

const payload = await getPayload({ config })
const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

// ---------- Administrátor ----------
const users = await payload.count({ collection: 'users' })
if (users.totalDocs === 0) {
  const email = process.env.ADMIN_EMAIL || 'admin@mathex.cz'
  const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url')
  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name: process.env.ADMIN_NAME || 'Jméno Příjmení',
      bio: 'Navrhuji a programuji rychlé weby pro řemeslníky, restaurace a malé firmy.',
    },
  })
  log(`Vytvořen administrátor ${email}${process.env.ADMIN_PASSWORD ? '' : ` s heslem: ${password}  (hned ho změň)`}`)
}

const already = await payload.count({ collection: 'services' })
if (already.totalDocs > 0) {
  log('Obsah už existuje, přeskakuji.')
  process.exit(0)
}

// ---------- Globální nastavení ----------
await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    brandName: 'Mathex',
    tagline: 'Weby na míru pro řemeslníky, restaurace a malé firmy',
    defaultDescription:
      'Navrhnu a naprogramuju rychlý web na míru do dvou týdnů. Pro řemeslníky, restaurace, kavárny, salony a další malé firmy. Pevná cena předem.',
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
    heroTitle: 'Weby pro řemeslníky, restaurace a malé firmy. Hotové do dvou týdnů.',
    heroText:
      'Navrhnu a naprogramuju web, který se načte dřív, než zákazník stihne odejít ke konkurenci. Žádné šablony, žádné měsíční poplatky za stavebnici.',
    process: [
      {
        title: 'Konzultace',
        text: 'Za 30 minut probereme, co děláte, kdo jsou vaši zákazníci a co má web umět. Pošlu vám pevnou cenu a termín.',
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
    closingTitle: 'Pojďme se na váš web podívat spolu',
    closingText:
      'Úvodní konzultace trvá 30 minut a je zdarma. Řeknete mi, co děláte a co od webu chcete, já vám řeknu, co to bude stát a kdy to bude hotové.',
  },
})

await payload.updateGlobal({
  slug: 'about-page',
  data: {
    headline: 'Jsem vývojář, který píše weby pro lidi, co mají plné ruce práce',
    body: rt(`
Tady bude váš příběh. Pár odstavců o tom, kdo jste, jak jste se k webům dostali a proč děláte weby právě pro malé firmy. Lidé si u freelancera kupují i člověka, takže klidně osobně.

## Proč weby na míru

Stavebnice typu Wix nebo Webnode jsou pomalé, vypadají podobně a platíte za ně každý měsíc. Web napsaný na míru se načte za zlomek času, Google ho má radši a patří celý vám.

## Co pro mě znamená rychlost

Rychlost je dvojí: web se rychle načte a já ho rychle dodám. Malá firma nemá čas čekat tři měsíce na agenturu.
    `),
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
  { topic: 'technika', question: 'Děláte i e-shopy?', answer: 'Zatím se soustředím na prezentační weby, rezervace a poptávkové formuláře. Web ale stavím tak, aby se k němu dal e-shop později přidat.' },
  { topic: 'obor', question: 'Umíte rezervace stolů nebo termínů?', answer: 'Ano. Rezervační systém s potvrzovacími e-maily a pozvánkou do kalendáře je součástí balíčku Web s rezervacemi.' },
  { topic: 'obor', question: 'Jde na web dát denní menu, které si budu měnit sám?', answer: 'Ano, menu upravíte v administraci za minutu, i z mobilu.' },
] as const

const faqIds: Record<string, number | string> = {}
for (const [i, f] of faqData.entries()) {
  const doc = await payload.create({ collection: 'faqs', data: { ...f, order: i, showOnFaqPage: true } })
  faqIds[f.question] = doc.id
}
const faqsFor = (...questions: string[]) => questions.map((q) => faqIds[q]).filter(Boolean)
log('FAQ hotové')

// ---------- Služby ----------
await payload.create({
  collection: 'services',
  data: {
    title: 'Weby pro řemeslníky',
    slug: 'weby-pro-remeslniky',
    segment: 'remeslnici',
    order: 1,
    headline: 'Web pro řemeslníky, ze kterého vám zákazníci rovnou zavolají',
    intro:
      'Instalatéři, elektrikáři, truhláři, malíři, zedníci. Zákazník vás hledá na mobilu, často ve spěchu. Web mu musí za pár vteřin ukázat, co děláte, kde působíte a jak vám zavolat.',
    shortDescription: 'Ukázky prací, oblast působnosti a tlačítko „Zavolat“ vždy po ruce. Pro instalatéry, elektrikáře, truhláře a další.',
    painPoints: [
      { text: 'Zakázky máte jen z doporučení a nevíte, jak získat nové.' },
      { text: 'Na Googlu vás předbíhá konkurence s horší prací.' },
      { text: 'Máte jen Facebook a lidé vás neberou vážně.' },
      { text: 'Starý web se na mobilu načítá věčnost.' },
    ],
    features: [
      { title: 'Galerie realizací', text: 'Fotky před a po prodají víc než jakýkoli text. Přidáte je sami z mobilu.' },
      { title: 'Zavolat jedním palcem', text: 'Telefon je vidět na každé stránce, na mobilu jako lepicí tlačítko.' },
      { title: 'Poptávkový formulář', text: 'Zákazník popíše práci a přiloží fotku. Poptávka vám přijde e-mailem.' },
      { title: 'Místní SEO', text: 'Stránky pro města, kde působíte, napojení na Google Business Profile a Firmy.cz.' },
      { title: 'Recenze od zákazníků', text: 'Hodnocení z Googlu přímo na webu, aby noví zákazníci věděli, že na vás je spoleh.' },
      { title: 'Rychlost na mobilu', text: 'Web se načte i na horším signálu na stavbě.' },
    ],
    faqs: faqsFor('Kolik stojí web na míru?', 'Nemám fotky ani texty. Vadí to?', 'Bude web vidět na Googlu?'),
  },
})

await payload.create({
  collection: 'services',
  data: {
    title: 'Weby pro restaurace a kavárny',
    slug: 'weby-pro-restaurace',
    segment: 'gastro',
    order: 2,
    headline: 'Web pro restauraci, kde je menu, otevírací doba a rezervace na první pohled',
    intro:
      'Host chce vědět tři věci: co vaříte, kdy máte otevřeno a jestli bude místo. Všechno ostatní je bonus. Web pro restauraci nebo kavárnu stavím přesně kolem toho.',
    shortDescription: 'Denní menu, které si měníte sami, rezervace stolů a otevírací doba, kterou Google ukáže ve vyhledávání.',
    painPoints: [
      { text: 'Denní menu posíláte jako fotku na Facebook a nikdo ho nenajde.' },
      { text: 'Rezervace chodí telefonem ve špičce, kdy nemáte čas.' },
      { text: 'Na Googlu je stará otevírací doba.' },
      { text: 'Menu na webu je PDF, které se na mobilu nedá číst.' },
    ],
    features: [
      { title: 'Denní a stálé menu', text: 'Upravíte ho v administraci za minutu. Čitelné na mobilu, žádné PDF.' },
      { title: 'Rezervace stolů', text: 'Host si vybere čas a počet osob, vám přijde e-mail a záznam do kalendáře.' },
      { title: 'Otevírací doba pro Google', text: 'Strukturovaná data, takže Google ukáže správné časy přímo ve výsledcích.' },
      { title: 'Fotky, které dělají chuť', text: 'Optimalizované, aby se načítaly bleskově i ve velkém rozlišení.' },
      { title: 'Akce a události', text: 'Degustace, živá hudba, sezónní menu. Vše na jednom místě.' },
      { title: 'Napojení na rozvoz', text: 'Odkazy na Wolt, Bolt Food nebo vlastní objednávky.' },
    ],
    faqs: faqsFor('Umíte rezervace stolů nebo termínů?', 'Jde na web dát denní menu, které si budu měnit sám?', 'Kolik stojí web na míru?'),
  },
})

await payload.create({
  collection: 'services',
  data: {
    title: 'Weby pro služby a obchody',
    slug: 'weby-pro-sluzby',
    segment: 'sluzby',
    order: 3,
    headline: 'Web pro salon, studio nebo poradnu, kde si klient rovnou zarezervuje termín',
    intro:
      'Kadeřnictví, kosmetika, fyzioterapie, fitness, poradci, autoservisy. Klient chce vidět ceník a volný termín. Když to najde za pár vteřin, rezervuje si.',
    shortDescription: 'Online rezervace termínů, přehledný ceník služeb a profil, který vzbudí důvěru. Pro salony, studia, poradce a servisy.',
    painPoints: [
      { text: 'Polovinu dne vyřizujete telefonáty kvůli termínům.' },
      { text: 'Klienti se ptají na ceny, které nejsou nikde napsané.' },
      { text: 'Platíte měsíčně za rezervační systém, který vypadá jako z roku 2010.' },
    ],
    features: [
      { title: 'Online rezervace', text: 'Klient si vybere službu a volný čas. Potvrzení i připomínka chodí automaticky.' },
      { title: 'Ceník služeb', text: 'Přehledně podle kategorií, upravíte ho sami.' },
      { title: 'Představení týmu', text: 'Fotky a krátké profily lidí, ke kterým klient přijde.' },
      { title: 'Dárkové poukazy', text: 'Formulář na objednání poukazu s platbou převodem.' },
      { title: 'Recenze', text: 'Hodnocení z Googlu přímo na webu.' },
      { title: 'Místní SEO', text: 'Aby vás našli lidé ve vaší čtvrti, když hledají „kadeřnictví poblíž“.' },
    ],
    faqs: faqsFor('Umíte rezervace stolů nebo termínů?', 'Budu si moct web upravovat sám?', 'Platím něco měsíčně?'),
  },
})
log('Služby hotové')

// ---------- Ceník ----------
await payload.create({
  collection: 'packages',
  data: {
    name: 'Vizitka',
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
await payload.create({
  collection: 'categories',
  data: { title: 'Ceny a rozpočet', slug: 'ceny', description: 'Kolik co stojí a za co se vyplatí zaplatit.' },
})

const admin = (await payload.find({ collection: 'users', limit: 1 })).docs[0]
const servicesList = await payload.find({ collection: 'services', limit: 10 })
const craftService = servicesList.docs.find((s) => s.segment === 'remeslnici')

await payload.create({
  collection: 'posts',
  data: {
    title: 'Co musí mít web řemeslníka, aby z něj chodily zakázky',
    slug: 'co-musi-mit-web-remeslnika',
    excerpt: 'Sedm věcí, podle kterých se zákazník rozhodne, jestli vám zavolá, nebo odejde ke konkurenci.',
    category: catTips.id,
    author: admin?.id,
    relatedService: craftService?.id,
    _status: 'published',
    publishedAt: new Date().toISOString(),
    content: rt(`
Zákazník, který hledá instalatéra, nemá čas číst. Otevře web na mobilu, během pár vteřin se rozhodne a buď zavolá, nebo jde o výsledek níž. Tady je, co musí najít.

## 1. Telefon na každé stránce

Číslo musí být vidět bez scrollování a musí jít jedním dotykem vytočit. Na mobilu nejlépe jako tlačítko, které je pořád dole na obrazovce.

## 2. Kde působíte

Napište konkrétní města a okresy. Zákazník z Kladna nechce volat, aby zjistil, že tam nejezdíte. A Google díky tomu ví, komu vás má ukázat.

## 3. Fotky skutečné práce

Fotky z fotobanky poznají všichni. Fotka hotové koupelny z mobilu je důvěryhodnější než sebelepší ilustrace.

## 4. Orientační ceny

Nemusíte psát přesný ceník. Stačí „výměna baterie od 900 Kč“ nebo „koupelna na klíč od 150 000 Kč“. Ušetří vám to telefonáty s lidmi, pro které jste moc drahý.

## 5. Recenze

Tři až pět skutečných hodnocení z Googlu s celým jménem udělá víc než odstavec o tom, jak jste spolehliví.

## 6. Rychlost

Pokud se web načítá déle než tři sekundy, polovina lidí odejde. Na stavbě se slabým signálem ještě dřív.

## 7. Údaje o firmě

Jméno, IČO a sídlo musí být na webu ze zákona. A navíc dodávají důvěru: je jasné, že nejste anonym.
    `),
  },
})

await payload.create({
  collection: 'posts',
  data: {
    title: 'Web na míru, nebo stavebnice? Srovnání pro malou firmu',
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

log('Hotovo! Přihlas se na /admin')
process.exit(0)
