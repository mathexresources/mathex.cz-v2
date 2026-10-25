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

## Nasazení na Raspberry Pi

Obraz se při každém pushi do `main` postaví na GitHubu pro amd64 i arm64 a nahraje se do
`ghcr.io/mathexresources/mathex.cz-v2`. Pi ho jen stáhne – žádný build na Pi.

**Požadavky:** Raspberry Pi 4 nebo 5 se 4 GB RAM a víc, 64bit systém (`uname -m` vypíše `aarch64`),
Docker s Compose. Doporučuju SSD místo SD karty – databáze SD kartu časem opotřebuje.

### Rychlá instalace (jeden příkaz)

```bash
curl -fsSL https://raw.githubusercontent.com/mathexresources/mathex.cz-v2/main/scripts/install.sh | bash
```

Skript zkontroluje systém, stáhne kód do `~/mathex`, vytvoří `.env` s náhodnými hesly, spustí web
a vypíše adresu (např. `http://192.168.0.101:3000`). Stejný příkaz slouží i k aktualizaci.

### Ruční instalace

### 1. Stažení a nastavení

```bash
git clone https://github.com/mathexresources/mathex.cz-v2.git mathex && cd mathex
cp .env.example .env
nano .env   # vyplň SITE_URL, POSTGRES_PASSWORD (openssl rand -hex 24), PAYLOAD_SECRET (openssl rand -hex 32)
```

### 2. Spuštění

```bash
docker compose pull
docker compose up -d
```

Při prvním startu se sama vytvoří databáze a nahraje výchozí obsah. Pak otevři `http://<ip-pi>:3000/admin`
(nebo `http://raspberrypi.local:3000/admin`) a založ si účet administrátora.
Port 3000 je dostupný jen z Pi samotného – z jiného počítače se připoj přes SSH tunel
`ssh -L 3000:localhost:3000 pi@raspberrypi.local`, nebo pokračuj krokem 3.

### 3. Zveřejnění webu bez otevírání portů (Cloudflare Tunnel)

Domácí připojení často nemá veřejnou IP a otevírat porty na routeru není bezpečné.
Cloudflare Tunnel to řeší zdarma a skryje i tvoji domácí IP adresu.

1. Doménu přidej do Cloudflare (stačí bezplatný plán) a u registrátora přepni DNS servery na Cloudflare.
2. V Cloudflare: **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**, pojmenuj ho a zkopíruj token do `.env` jako `CLOUDFLARE_TUNNEL_TOKEN`.
3. V tunelu přidej **Public Hostname**: doména `tvoje-domena.cz`, služba `HTTP`, URL `web:3000`. Totéž pro `www`.
4. Spusť:

```bash
docker compose --profile tunnel up -d
```

HTTPS i certifikáty řeší Cloudflare. Nezapomeň v `.env` nastavit `SITE_URL=https://tvoje-domena.cz`
a restartovat web: `docker compose up -d web`.

### Aktualizace

```bash
git pull                       # jen když se změnil docker-compose.yml nebo .env.example
docker compose pull && docker compose --profile tunnel up -d
docker image prune -f          # smaže staré verze obrazu
```

### Zálohy

Služba `backup` každý den uloží databázi do složky `./backups` (drží 14 dní).
Nahrané obrázky jsou ve svazku `media`. Obnova databáze:

```bash
gunzip -c backups/db-2026-10-25.sql.gz | docker compose exec -T db psql -U mathex mathex
```

Zálohy kopíruj i mimo Pi (jiný disk, cloud) – když odejde disk, odejdou i zálohy.

### Užitečné příkazy

```bash
docker compose ps              # stav služeb (web má kontrolu stavu na /healthz)
docker compose logs -f web     # logy webu, tady uvidíš i e-maily, dokud nenastavíš SMTP
docker compose restart web
```

### Build přímo na serveru

Když nechceš používat obraz z GitHubu: `docker compose build web && docker compose up -d`.
Na Pi 4 to trvá zhruba 10–20 minut a potřebuje aspoň 4 GB RAM.

## Lokální vývoj

```bash
cp .env.example .env    # + DATABASE_URI=postgres://mathex:heslo@localhost:5432/mathex
# potřebuješ běžící PostgreSQL (lokálně nebo v Dockeru s publikovaným portem 5432)
npm install
npm run dev             # http://localhost:3000, administrace na /admin
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
