#!/usr/bin/env bash
# Přidá domény do lokálně spravovaného Cloudflare Tunnelu (/etc/cloudflared/config.yml)
# a nasměruje na ně DNS. Před změnou udělá zálohu a konfiguraci ověří.
#
#   sudo bash scripts/cloudflared-add.sh http://localhost:3000 mathex.cz www.mathex.cz
set -euo pipefail

CONFIG="${CLOUDFLARED_CONFIG:-/etc/cloudflared/config.yml}"
SERVICE="${1:?Použití: $0 <služba, např. http://localhost:3000> <doména> [další domény…]}"
shift
[ $# -ge 1 ] || { echo "Zadej aspoň jednu doménu." >&2; exit 1; }
[ "$(id -u)" = 0 ] || { echo "Spusť přes sudo." >&2; exit 1; }
[ -f "$CONFIG" ] || { echo "Nenalezen $CONFIG" >&2; exit 1; }
grep -qE '^\s*-\s*service:\s*http_status:404' "$CONFIG" || { echo "V $CONFIG chybí koncové pravidlo '- service: http_status:404'." >&2; exit 1; }

TUNNEL=$(awk '/^tunnel:/ {print $2}' "$CONFIG")
BACKUP="$CONFIG.bak-$(date +%Y%m%d-%H%M%S)"
cp -a "$CONFIG" "$BACKUP"
echo "Záloha: $BACKUP"

# Vložit pravidla těsně před koncové "- service: http_status:404" se stejným odsazením
TMP=$(mktemp)
awk -v svc="$SERVICE" -v hosts="$*" '
  BEGIN { n = split(hosts, H, " ") }
  /^[[:space:]]*-[[:space:]]*service:[[:space:]]*http_status:404/ && !done {
    match($0, /^[[:space:]]*/); ind = substr($0, 1, RLENGTH)
    for (i = 1; i <= n; i++) {
      if (seen[H[i]]) continue
      print ind "- hostname: " H[i]
      print ind "  service: " svc
    }
    done = 1
  }
  /hostname:/ { h = $NF; seen[h] = 1 }
  { print }
' "$CONFIG" > "$TMP"

if diff -q "$CONFIG" "$TMP" >/dev/null; then
  echo "Domény už v tunelu jsou, konfiguraci neměním."
  rm -f "$TMP"
else
  cat "$TMP" > "$CONFIG"; rm -f "$TMP"
  if ! cloudflared tunnel --config "$CONFIG" ingress validate; then
    echo "Konfigurace je neplatná, vracím zálohu." >&2
    cp -a "$BACKUP" "$CONFIG"; exit 1
  fi
  for h in "$@"; do
    printf 'Pravidlo pro %s: ' "$h"
    cloudflared tunnel --config "$CONFIG" ingress rule "https://$h" | grep -E 'service' | head -1 || true
  done
  systemctl restart cloudflared
  sleep 3
  systemctl is-active --quiet cloudflared || { echo "cloudflared se nespustil, vracím zálohu." >&2; cp -a "$BACKUP" "$CONFIG"; systemctl restart cloudflared; exit 1; }
  echo "Tunel restartován."
fi

# DNS: CNAME <doména> → <tunel>.cfargotunnel.com (potřebuje cert.pem z `cloudflared tunnel login`)
if [ -z "${TUNNEL_ORIGIN_CERT:-}" ]; then
  for c in /root/.cloudflared/cert.pem /etc/cloudflared/cert.pem "${SUDO_USER:+/home/$SUDO_USER/.cloudflared/cert.pem}"; do
    if [ -n "$c" ] && [ -f "$c" ]; then export TUNNEL_ORIGIN_CERT="$c"; break; fi
  done
fi
for h in "$@"; do
  if cloudflared tunnel route dns --overwrite-dns "$TUNNEL" "$h" 2>/tmp/cfdns.err; then
    echo "DNS: $h → tunel"
  else
    echo "DNS pro $h se nepodařilo nastavit automaticky ($(tail -1 /tmp/cfdns.err))."
    echo "  Nastav ručně v Cloudflare → DNS: CNAME  $h  →  $TUNNEL.cfargotunnel.com  (Proxied)"
  fi
done
