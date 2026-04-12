FROM node:24-slim AS base
RUN corepack enable pnpm

# --- Web build ---
FROM base AS web-build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/cli/package.json apps/cli/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/web/ apps/web/
RUN pnpm --filter @tascal/web run build

# --- API build ---
FROM base AS api-build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/cli/package.json apps/cli/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY apps/api/ apps/api/
RUN pnpm --filter @tascal/api run build
RUN pnpm deploy --filter @tascal/api --prod /app/api-deploy

# --- Production ---
FROM base AS production
WORKDIR /app

COPY --from=api-build /app/api-deploy ./
COPY --from=api-build /app/apps/api/dist ./dist
COPY --from=web-build /app/apps/web/dist ./public
COPY --from=api-build /app/apps/api/drizzle ./drizzle

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/src/index.js"]
