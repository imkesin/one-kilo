# syntax=docker/dockerfile:1

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=@one-kilo/server... --filter=.
RUN pnpm turbo build --filter=@one-kilo/server...
RUN pnpm deploy --filter @one-kilo/server --prod /prod/server

FROM base
ENV NODE_ENV=production
COPY --from=build /prod/server /prod/server
COPY --from=build /usr/src/app/apps/server/dist /prod/server/dist
WORKDIR /prod/server
EXPOSE 10000
CMD ["node", "--enable-source-maps", "dist/src/main.js"]
