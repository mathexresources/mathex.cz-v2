# Mathex – web pro tvorbu webů na míru

Prezentační web s portfoliem, ceníkem, blogem, administrací a rezervací konzultací.
Postavený na **Next.js 16** + **Payload CMS 3** (administrace běží ve stejné aplikaci na `/admin`) a **PostgreSQL**. Nasazení přes Docker Compose.

## Co web umí

**Stránky**
- Úvod s živým měřením rychlosti stránky přímo v prohlížeči návštěvníka
- Služby podle oboru (řemeslníci, gastro, služby) – samostatné landing pages pro SEO
- Portfolio s případovými studiemi (doba realizace, PageSpeed skóre, reference)
- Ceník s balíčky, FAQ, O mně, Kontakt
- Blog s kategoriemi, stránkováním, dobou čtení, autorem a RSS
- Textové stránky (ochrana osobních údajů, cookies…) a vlastní 404

**Rezervace konzultací**
- Typy schůzek (online, telefon, osobně) s vlastní délkou
- Pracovní doba, krok slotů, pauza mezi schůzkami, minimální předstih, max. schůzek za den, dovolené
- Volitelně blokuje časy obsazené ve tvém Google Kalendáři (tajná iCal adresa, bez OAuth)
- Potvrzovací e-mail klientovi i tobě s pozvánkou `.ics`, zrušení přes odkaz v e-mailu
- Odběr všech rezervací do kalendáře přes `/kalendar.ics?token=…`
- Ochrana proti dvojí rezervaci téhož termínu

**Administrace (`/admin`, česky)**
- Obsah: služby, portfolio, ceník, reference, FAQ, textové stránky, média
- Blog: články s koncepty a automatickým ukládáním, kategorie
- Klienti: rezervace a poptávky jako jednoduché CRM se stavy
- Nastavení: firemní údaje, kontakty, profily, rezervace
- SEO pole (titulek, popis, obrázek) u každé stránky a článku s náhledem ve výsledcích Googlu

**SEO a výkon**
- Server-side rendering, cache s okamžitou invalidací po úpravě v administraci
- `sitemap.xml`, `robots.txt`, canonical URL, Open Graph a Twitter karty
- Automaticky generované obrázky pro sdílení (`opengraph-image`)
- Strukturovaná data: ProfessionalService, Person, WebSite, BreadcrumbList, FAQPage, BlogPosting, Service, OfferCatalog
- Obrázky v AVIF/WebP se `srcset`, písma podmnožená na češtinu (2 × 40 kB) s preloadem, CSS vložené do HTML
- Lighthouse (lokální měření): desktop výkon 100, mobil 86–93, přístupnost a best practices 100
- Bezpečnostní hlavičky (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Analytika bez cookies (Plausible nebo Umami) – není potřeba cookie lišta

**Formuláře**
- Honeypot, minimální doba vyplnění, omezení počtu odeslání z IP, volitelně Cloudflare Turnstile
- Zachování vyplněných údajů při chybě, srozumitelné chybové hlášky

## Nasazení na server (Docker)

Požadavky: Docker s Compose, reverzní proxy s HTTPS (Caddy, Nginx, Traefik…).

```bash
git clone https://github.com/mathexresources/mathex.cz-v2.git
cd mathex.cz-v2
cp .env.example .env
# vyplň minimálně: NEXT_PUBLIC_SITE_URL, POSTGRES_PASSWORD, PAYLOAD_SECRET (openssl rand -hex 32)

# 1) databáze + výchozí obsah a účet administrátora (migrace se spustí samy)
docker compose up -d db
ADMIN_EMAIL=ty@mathex.cz ADMIN_PASSWORD='silne-heslo' \
  docker compose --profile tools run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD tools

# 2) web
docker compose up -d --build
```

Seed spouštěj před prvním spuštěním webu. Kdyby se obsah nahraný mimo administraci na webu neprojevil, pomůže `docker compose up -d --force-recreate web` (vyčistí cache).

Web poslouchá na `127.0.0.1:3000`. Příklad pro **Caddy**:

```
mathex.cz, www.mathex.cz {
  @www host www.mathex.cz
  redir @www https://mathex.cz{uri} permanent
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Aktualizace webu: `git pull && docker compose up -d --build`.
Zálohy: databáze (`docker compose exec db pg_dump -U mathex mathex > zaloha.sql`) a svazek `media`.

## Lokální vývoj

```bash
cp .env.example .env    # DATABASE_URI na lokální Postgres
docker compose up -d db # nebo vlastní Postgres
npm install
npm run dev             # http://localhost:3000, administrace na /admin
npm run seed            # výchozí obsah
```

Po změně kolekcí nebo polí:

```bash
npm run generate:types       # TypeScript typy (src/payload-types.ts)
npm run generate:importmap   # pokud přibyly vlastní komponenty administrace
npm run migrate:create       # migrace databáze – commitni ji, v produkci se spustí sama
```

## Rezervace a kalendář

- **Obsazenost z Google Kalendáře:** Google Kalendář → Nastavení kalendáře → *Tajná adresa ve formátu iCal* → vlož do `BUSY_CALENDAR_ICS_URL`. Časy, kdy máš něco v kalendáři, se nebudou nabízet (načítá se každých 5 minut).
- **Rezervace do kalendáře:** nastav `CALENDAR_FEED_TOKEN` a v Google Kalendáři přidej *Další kalendáře → Přidat podle URL* → `https://mathex.cz/kalendar.ics?token=…`.
- Bez `SMTP_HOST` se e-maily jen vypisují do logu (`docker compose logs web`).

## Struktura

```
src/
  app/(frontend)/     stránky webu
  app/(payload)/      administrace a API (Payload)
  actions/            serverové akce (rezervace, kontaktní formulář)
  collections/        datový model – kolekce
  globals/            datový model – nastavení
  components/         komponenty webu
  lib/                data, SEO, strukturovaná data, čas, sloty, e-maily, .ics
  seed/               výchozí obsah
```

## Po spuštění

- [ ] Doplnit firemní údaje v *Nastavení webu* (jméno, IČO, adresa)
- [ ] Projít a doplnit *Zásady ochrany osobních údajů* (jsou to návrhy)
- [ ] Nahrát fotku do *O mně* a screenshoty k projektům v portfoliu
- [ ] Upravit ceny balíčků
- [ ] Ověřit web v Google Search Console a Seznam Webmaster, odeslat sitemapu
- [ ] Založit Google Business Profile a Firmy.cz, doplnit odkazy do *Nastavení webu → Profily*
- [ ] Nastavit SPF, DKIM a DMARC pro e-mailovou doménu
