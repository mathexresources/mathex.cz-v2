/**
 * Výchozí texty webu. Používá je seed (nová instalace) i migrace obsahu
 * (`20261025_230000_broaden_content`), která je na běžícím webu nasadí jen tam,
 * kde zůstal původní výchozí text.
 */
import { rt } from './richtext'

export const SITE = {
  tagline: 'Weby na míru a přednášky o bezpečnosti na internetu',
  defaultDescription:
    'Navrhuji a programuji rychlé a bezpečné weby na míru a přednáším o bezpečnosti na internetu, phishingu a OSINT pro firmy, školy i veřejnost.',
}

export const HOME = {
  heroTitle: 'Rychlé a bezpečné weby na míru. A přednášky o tom, jak se na internetu nenechat napálit.',
  heroText:
    'Navrhnu a naprogramuju web pro vaši firmu, projekt nebo organizaci – bez šablon, s pevnou cenou a hotový v řádu týdnů. Na přednáškách ukazuji firmám, školám i veřejnosti, jak fungují phishingové útoky, co o nich prozradí internet (OSINT) a jak se bránit.',
  closingTitle: 'Pojďme to probrat',
  closingText:
    'Úvodní konzultace trvá 30 minut a je zdarma. Ať jde o nový web, nebo přednášku pro vaše lidi, řeknu vám, co to obnáší, kolik to stojí a kdy to stihneme.',
}

export const ABOUT = {
  headline: 'Programuju weby a učím lidi, jak být na internetu v bezpečí',
  body: () =>
    rt(`
Tady bude váš příběh. Pár odstavců o tom, kdo jste, jak jste se dostali k webům a k bezpečnosti na internetu a pro koho pracujete. Lidé si u freelancera kupují i člověka, takže klidně osobně.

## Proč weby na míru

Stavebnice typu Wix nebo Webnode jsou pomalé, vypadají podobně a platíte za ně každý měsíc. Web napsaný na míru se načte za zlomek času, Google ho má radši a patří celý vám.

## Proč přednáším o bezpečnosti

Spousta útoků nezačíná u hackera, ale u jednoho kliknutí na podvodný odkaz – a útočník si předtím v klidu dohledá, komu ho poslat. Ukazuji, jak phishing a OSINT fungují z pohledu útočníka, protože nejlepší ochrana je vědět, na co si dát pozor.
    `),
}

export const WEB_SERVICE = {
  title: 'Weby na míru',
  slug: 'weby-na-miru',
  segment: 'weby' as const,
  order: 1,
  headline: 'Web na míru, který je rychlý, bezpečný a patří vám',
  intro:
    'Pro firmy, živnostníky, spolky, školy i osobní projekty. Navrhnu a naprogramuju web bez šablon a stavebnic. Načte se okamžitě, dobře se hledá na Googlu a texty si upravíte sami.',
  shortDescription:
    'Prezentační weby, rezervace termínů a poptávkové formuláře. Rychlé, bezpečné a s administrací, ve které si všechno upravíte sami.',
  painPoints: [
    'Starý web se na mobilu načítá věčnost a lidé odcházejí.',
    'Za stavebnici platíte každý měsíc, a web vám přitom nepatří.',
    'Na Googlu vás předbíhá konkurence.',
    'Kvůli každé změně musíte psát e-mail a týden čekat.',
  ],
  features: [
    { title: 'Rychlost', text: 'Na mobilu aspoň 90 bodů v Google PageSpeed. Rychlý web mají raději návštěvníci i Google.' },
    { title: 'Design na míru', text: 'Žádná šablona. Web vypadá jako vy, ne jako tisíc dalších.' },
    { title: 'Administrace', text: 'Texty, fotky, ceník nebo články upravíte sami, i z mobilu.' },
    { title: 'Vidět na Googlu', text: 'Technické SEO v základu: rychlost, strukturovaná data, sitemapa a správné nadpisy.' },
    { title: 'Rezervace a formuláře', text: 'Online rezervace termínů s pozvánkou do kalendáře a poptávky přímo do e-mailu.' },
    {
      title: 'Bezpečnost',
      text: 'HTTPS, pravidelné zálohy, ochrana formulářů proti spamu a žádné zbytečné pluginy, přes které se dá web napadnout.',
    },
  ],
  faqQuestions: ['Kolik stojí web na míru?', 'Jak dlouho trvá výroba webu?', 'Budu si moct web upravovat sám?'],
}

export const LECTURE_SERVICE = {
  title: 'Přednášky o bezpečnosti na internetu',
  slug: 'prednasky-bezpecnost-na-internetu',
  segment: 'bezpecnost' as const,
  order: 2,
  headline: 'Přednášky o bezpečnosti na internetu, phishingu a OSINT',
  intro:
    'Ukážu, jak útočníci doopravdy pracují: jak vypadá phishingový útok, co všechno o vás nebo o firmě dohledají z veřejných zdrojů (OSINT) a jak se proti tomu bránit. Srozumitelně, na skutečných příkladech a bez strašení. Pro firmy, školy, úřady i veřejnost.',
  shortDescription:
    'Phishing, OSINT, sociální inženýrství a zabezpečení účtů. Přednášky pro firmy, školy, úřady i veřejnost.',
  painPoints: [
    'Kolegům chodí podvodné e-maily, které vypadají jako od banky, dodavatele nebo od šéfa.',
    'Nevíte, co všechno se o vás nebo o firmě dá dohledat na internetu.',
    'Na sociálních sítích sdílíte víc, než by útočník potřeboval vědět.',
    'Všude stejné heslo a dvoufázové ověření nikdo nepoužívá.',
  ],
  features: [
    { title: 'Phishingové útoky', text: 'Jak vypadá podvodný e-mail, SMS nebo falešná přihlašovací stránka. Cílené útoky na konkrétní lidi a firmy.' },
    { title: 'OSINT – co o vás ví internet', text: 'Co se dá dohledat z veřejných zdrojů, sociálních sítí a uniklých databází. Ukázka naživo.' },
    { title: 'Sociální inženýrství', text: 'Falešní bankéři, „technická podpora“ a podvodníci vydávající se za kolegu nebo šéfa.' },
    { title: 'Hesla a dvoufázové ověření', text: 'Jak mít silná hesla a nemuset si je pamatovat. Proč a jak zapnout dvoufázové ověření.' },
    { title: 'Digitální stopa a soukromí', text: 'Co o sobě nesdílet, jak si nastavit soukromí a jak svou stopu zmenšit.' },
    { title: 'Když už se to stalo', text: 'Komu volat, co zablokovat a jak zachránit účet, peníze i data.' },
  ],
  body: () =>
    rt(`
## Pro koho

- Firmy a úřady – pro zaměstnance, kteří pracují s e-mailem, fakturami a citlivými daty.
- Školy – pro studenty, učitele i rodiče, s příklady z jejich světa.
- Veřejnost, knihovny a spolky – prakticky a bez odborných slov.

## Jak to probíhá

1. Domluvíme publikum, témata, délku a místo.
2. Obsah připravím na míru vašim lidem – u firem klidně s ukázkou, co se dá dohledat přímo o vás.
3. Přednáška je plná ukázek a prostoru na otázky.

Délka i cena jsou podle domluvy. Napište mi, co potřebujete, a pošlu nabídku.
    `),
  faqQuestions: ['Pro koho jsou přednášky?', 'Jak dlouhá je přednáška a kolik stojí?', 'Co potřebujete na místě?'],
}

export const LECTURE_FAQS = [
  {
    topic: 'prednasky' as const,
    question: 'Pro koho jsou přednášky?',
    answer:
      'Pro firmy a úřady, školy (studenty, učitele i rodiče), knihovny, spolky a další organizace. Témata i jazyk přizpůsobím publiku.',
  },
  {
    topic: 'prednasky' as const,
    question: 'Jak dlouhá je přednáška a kolik stojí?',
    answer: 'Délka i cena jsou podle domluvy – záleží na publiku, tématech a místě. Napište mi, co potřebujete, a pošlu nabídku.',
  },
  {
    topic: 'prednasky' as const,
    question: 'Co potřebujete na místě?',
    answer: 'Projektor nebo velkou obrazovku a připojení k internetu. Všechno ostatní si přivezu.',
  },
]

export const WEB_SECURITY_FAQ = {
  topic: 'technika' as const,
  question: 'Jak je web zabezpečený?',
  answer:
    'HTTPS, pravidelné zálohy, ochrana formulářů proti spamu a minimum závislostí, přes které by se dalo do webu dostat. Bezpečnosti se věnuji i v přednáškách, takže ji u webů neodbývám.',
}

/** Oborové otázky z původního výchozího obsahu – migrace je smaže, pokud zůstaly beze změny. */
export const LEGACY_NICHE_FAQS = [
  {
    question: 'Umíte rezervace stolů nebo termínů?',
    answer: 'Ano. Rezervační systém s potvrzovacími e-maily a pozvánkou do kalendáře je součástí balíčku Web s rezervacemi.',
  },
  { question: 'Jde na web dát denní menu, které si budu měnit sám?', answer: 'Ano, menu upravíte v administraci za minutu, i z mobilu.' },
]

export const SECURITY_CATEGORY = {
  title: 'Bezpečnost na internetu',
  slug: 'bezpecnost',
  description: 'Jak poznat podvod, chránit si účty a nepřijít o peníze ani data.',
}

export const SECURITY_POST = {
  title: 'Jak poznat podvodný e-mail: 7 varovných signálů',
  slug: 'jak-poznat-podvodny-email',
  excerpt: 'Podvodné e-maily vypadají čím dál věrohodněji. Těchhle sedm signálů prozradí většinu z nich.',
  content: () =>
    rt(`
Podvodné e-maily (phishing) dnes nepřichází se směšnou češtinou. Vypadají jako zpráva z banky, od přepravce, z úřadu nebo od kolegy. Tady je sedm věcí, které je spolehlivě prozradí.

## 1. Adresa odesílatele nesedí

Jméno může být „Česká pošta“, ale adresa je z úplně jiné domény. Vždy se podívejte na celou adresu, ne jen na jméno.

## 2. Spěch a strach

„Váš účet bude zablokován do 24 hodin.“ „Zásilka bude vrácena.“ Tlak na rychlé rozhodnutí je nejčastější trik – podvodník nechce, abyste přemýšleli.

## 3. Odkaz vede jinam, než tvrdí

Na počítači najeďte na odkaz myší a podívejte se, kam doopravdy vede. Na mobilu podržte prst na odkazu. Když adresa nesedí, neklikejte.

## 4. Chtějí přihlašovací údaje nebo platbu

Banka ani úřad vás e-mailem nikdy nepožádá o heslo, PIN nebo údaje z karty. Žádost o „ověření účtu“ přes odkaz je skoro vždy podvod.

## 5. Nečekaná příloha

Faktura, kterou nečekáte, nebo „dokument ke stažení“. Přílohy typu .zip, .exe nebo dokumenty, které chtějí „povolit obsah“, neotevírejte.

## 6. Příliš dobré, než aby to byla pravda

Výhra v soutěži, do které jste se nepřihlásili, dědictví nebo vrácení přeplatku. Zadarmo vám nikdo nic neposílá.

## 7. Nezvyklá žádost od známého

„Jsem na jednání, potřebuju rychle zaplatit fakturu.“ Když vám šéf nebo kolega píše nezvykle, ověřte si to telefonem – ne odpovědí na ten e-mail.

## Co dělat, když už jste klikli

- Hned změňte heslo k účtu, kterého se to týká, a zapněte dvoufázové ověření.
- Pokud jste zadali údaje z karty nebo do bankovnictví, okamžitě volejte do banky a nechte kartu zablokovat.
- V práci to hned řekněte správci IT. Čím dřív o tom ví, tím menší škoda.
    `),
}

export const GENERAL_WEB_POST = {
  title: 'Co musí mít web malé firmy, aby přiváděl zákazníky',
  slug: 'co-musi-mit-web-firmy',
  excerpt: 'Sedm věcí, podle kterých se návštěvník rozhodne, jestli se vám ozve, nebo odejde ke konkurenci.',
  content: () =>
    rt(`
Návštěvník, který vás najde na Googlu, nemá čas číst. Otevře web na mobilu, během pár vteřin se rozhodne a buď se ozve, nebo jde o výsledek níž. Tady je, co musí najít.

## 1. Kontakt na každé stránce

Telefon nebo tlačítko pro rezervaci musí být vidět bez scrollování a musí jít jedním dotykem použít.

## 2. Co děláte a kde

Jednou větou, srozumitelně. A pokud působíte jen v některých městech, napište to – Google díky tomu ví, komu vás má ukázat.

## 3. Skutečné fotky

Fotky z fotobanky poznají všichni. Fotka vaší práce, týmu nebo provozovny z mobilu je důvěryhodnější než sebelepší ilustrace.

## 4. Orientační ceny

Nemusíte psát přesný ceník. Stačí „od 900 Kč“ nebo „projekty obvykle od 30 000 Kč“. Ušetří vám to dotazy od lidí, pro které nejste.

## 5. Recenze

Tři až pět skutečných hodnocení s celým jménem udělá víc než odstavec o tom, jak jste spolehliví.

## 6. Rychlost

Pokud se web načítá déle než tři sekundy, velká část lidí odejde dřív, než ho vůbec uvidí.

## 7. Údaje o firmě

Jméno, IČO a sídlo musí být na webu ze zákona. A navíc dodávají důvěru: je jasné, že nejste anonym.
    `),
}

/** Původní výchozí hodnoty – migrace podle nich pozná, co jsi ještě neupravoval. */
export const LEGACY = {
  tagline: 'Weby na míru pro řemeslníky, restaurace a malé firmy',
  defaultDescription:
    'Navrhnu a naprogramuju rychlý web na míru do dvou týdnů. Pro řemeslníky, restaurace, kavárny, salony a další malé firmy. Pevná cena předem.',
  heroTitle: 'Weby pro řemeslníky, restaurace a malé firmy. Hotové do dvou týdnů.',
  heroText:
    'Navrhnu a naprogramuju web, který se načte dřív, než zákazník stihne odejít ke konkurenci. Žádné šablony, žádné měsíční poplatky za stavebnici.',
  closingTitle: 'Pojďme se na váš web podívat spolu',
  closingText:
    'Úvodní konzultace trvá 30 minut a je zdarma. Řeknete mi, co děláte a co od webu chcete, já vám řeknu, co to bude stát a kdy to bude hotové.',
  aboutHeadline: 'Jsem vývojář, který píše weby pro lidi, co mají plné ruce práce',
  aboutBodyStart: 'Tady bude váš příběh. Pár odstavců o tom, kdo jste, jak jste se k webům dostali a proč děláte weby právě pro malé firmy.',
  userBio: 'Navrhuji a programuji rychlé weby pro řemeslníky, restaurace a malé firmy.',
  services: {
    'weby-pro-remeslniky': 'Web pro řemeslníky, ze kterého vám zákazníci rovnou zavolají',
    'weby-pro-restaurace': 'Web pro restauraci, kde je menu, otevírací doba a rezervace na první pohled',
    'weby-pro-sluzby': 'Web pro salon, studio nebo poradnu, kde si klient rovnou zarezervuje termín',
  } as Record<string, string>,
  craftPost: {
    slug: 'co-musi-mit-web-remeslnika',
    title: 'Co musí mít web řemeslníka, aby z něj chodily zakázky',
  },
}

export const USER_BIO = 'Navrhuji a programuji rychlé weby na míru a přednáším o bezpečnosti na internetu.'
