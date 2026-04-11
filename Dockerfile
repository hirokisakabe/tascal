FROM node:24-slim AS base

# --- Web build ---
FROM base AS web-build
WORKDIR /app/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY tsconfig.json /app/tsconfig.json
COPY apps/api/tsconfig.json /app/apps/api/tsconfig.json
COPY apps/web/ ./
RUN npx vite build

# --- API build ---
FROM base AS api-build
WORKDIR /app/apps/api
COPY apps/api/package.json apps/api/package-lock.json ./
COPY tsconfig.json /app/tsconfig.json
RUN npm ci
COPY apps/api/ ./
RUN npm run build

# --- Production ---
FROM base AS production
WORKDIR /app

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=api-build /app/apps/api/dist ./dist
COPY --from=web-build /app/apps/web/dist ./public
COPY --from=api-build /app/apps/api/drizzle ./drizzle

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/src/index.js"]
