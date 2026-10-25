#!/usr/bin/env bash
# Instalace / aktualizace webu na serveru s Dockerem (Raspberry Pi i jiný Linux).
#   curl -fsSL https://raw.githubusercontent.com/mathexresources/mathex.cz-v2/main/scripts/install.sh | bash
# Bezpečné spustit opakovaně: existující .env a data nepřepíše, jen stáhne novou verzi.
#
# Volitelně při první instalaci:
#   SITE_URL=https://mathex.cz   adresa webu (výchozí http://<ip>:3000)
#   WEB_BIND=127.0.0.1           jen lokálně, např. za Cloudflare Tunnelem (výchozí 0.0.0.0 = celá domácí síť)
set -euo pipefail

DIR="${MATHEX_DIR:-$HOME/mathex}"
REPO="https://github.com/mathexresources/mathex.cz-v2.git"

say() { printf '\n\033[1;33m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mChyba:\033[0m %s\n' "$*" >&2; exit 1; }

say "Kontrola systému"
arch=$(uname -m)
case "$arch" in aarch64|arm64|x86_64) echo "Architektura: $arch";; *) die "Nepodporovaná architektura $arch (potřebuješ 64bitový systém – aarch64)";; esac
command -v git >/dev/null || die "Chybí git: sudo apt install -y git"
command -v docker >/dev/null || die "Chybí Docker: curl -fsSL https://get.docker.com | sh"
docker compose version >/dev/null 2>&1 || die "Chybí Docker Compose plugin: sudo apt install -y docker-compose-plugin"
if docker info >/dev/null 2>&1; then DOCKER="docker"
elif sudo -n docker info >/dev/null 2>&1; then DOCKER="sudo docker"
else die "Uživatel $(whoami) nemá přístup k Dockeru: sudo usermod -aG docker $(whoami) a pak se odhlas a přihlas"; fi
mem=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo); echo "RAM: ${mem} MB"
if [ "$mem" -lt 1800 ]; then echo "Upozornění: málo paměti, web může být pomalý."; fi

say "Stažení kódu do $DIR"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only
else git clone --depth 1 "$REPO" "$DIR"; fi
cd "$DIR"

if [ ! -f .env ]; then
  say "Vytvářím .env s náhodnými hesly"
  ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  rnd() { openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }
  cp .env.example .env
  sed -i \
    -e "s|^SITE_URL=.*|SITE_URL=${SITE_URL:-http://${ip:-localhost}:3000}|" \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(rnd 24)|" \
    -e "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=$(rnd 32)|" \
    -e "s|^CALENDAR_FEED_TOKEN=.*|CALENDAR_FEED_TOKEN=$(rnd 24)|" \
    -e "s|^WEB_BIND=.*|WEB_BIND=${WEB_BIND:-0.0.0.0}|" \
    .env
  chmod 600 .env
else
  say ".env už existuje, nechávám ho beze změny"
fi
mkdir -p backups

PROFILES=""
if grep -qE '^CLOUDFLARE_TUNNEL_TOKEN=.+' .env; then PROFILES="--profile tunnel"; fi

say "Stahuji obrazy"
$DOCKER compose $PROFILES pull --quiet

say "Spouštím"
$DOCKER compose $PROFILES up -d --remove-orphans

say "Čekám, až web naběhne (první start nahrává databázi a obsah)"
for i in $(seq 1 100); do
  if curl -fsS http://127.0.0.1:3000/healthz >/dev/null 2>&1; then ok=1; break; fi
  sleep 3
done
$DOCKER image prune -f >/dev/null 2>&1 || true

if [ "${ok:-}" = 1 ]; then
  url=$(grep -E '^SITE_URL=' .env | cut -d= -f2-)
  say "Hotovo"
  echo "Web:            $url"
  echo "Administrace:   $url/admin  (při prvním otevření si založ účet)"
  echo "Logy:           cd $DIR && docker compose logs -f web"
else
  $DOCKER compose ps
  $DOCKER compose logs --tail 40 web
  die "Web se do 5 minut nespustil – výpis logů je výše."
fi
