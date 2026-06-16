# syntax=docker/dockerfile:1

FROM node:26-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install --global corepack@latest && corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=@one-kilo/web... --filter=.
RUN pnpm turbo build --filter=@one-kilo/web...

FROM base
ENV NODE_ENV=production
ENV HOST="0.0.0.0"
ENV PORT=11000
WORKDIR /app
#
# TanStack Start's Nitro node-server preset emits a self-contained bundle in
# .output (server + bundled deps + .output/public assets) — no node_modules at runtime.
#
COPY --from=build /usr/src/app/apps/web/.output ./.output
EXPOSE 11000
CMD ["node", ".output/server/index.mjs"]
