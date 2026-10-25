# syntax=docker/dockerfile:1.7
#
# Jeden obraz pro libovolnou doménu – adresa webu, klíče a analytika se nastavují
# až za běhu v .env. Obraz se automaticky staví na GitHubu pro amd64 i arm64
# (Raspberry Pi), viz .github/workflows/docker.yml.

FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---------- závislosti ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Při buildu se k databázi nepřipojuje, Payload jen potřebuje, aby proměnné existovaly.
ENV PAYLOAD_SECRET=build-time-placeholder \
    DATABASE_URI=postgres://build:build@localhost:5432/build \
    NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

# ---------- runtime ----------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MEDIA_DIR=/app/media
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /app/media && chown nextjs:nodejs /app/media
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Migrace databáze se spouští automaticky při startu (prodMigrations v payload.config.ts)
CMD ["node", "server.js"]
