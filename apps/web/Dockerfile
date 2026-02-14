# syntax=docker/dockerfile:1

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
ARG WORKOS_CLIENT_ID
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN WORKOS_CLIENT_ID=$WORKOS_CLIENT_ID pnpm turbo build --filter=@one-kilo/web...

FROM base
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
WORKDIR /app
COPY --from=build /usr/src/app/apps/web/.next/standalone ./
COPY --from=build /usr/src/app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
