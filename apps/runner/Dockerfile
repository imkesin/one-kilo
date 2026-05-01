# syntax=docker/dockerfile:1

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter=@one-kilo/runner... --filter=.
RUN pnpm turbo build --filter=@one-kilo/runner...
RUN pnpm deploy --filter @one-kilo/runner --prod /prod/runner

FROM base
ENV NODE_ENV=production
COPY --from=build /prod/runner /prod/runner
COPY --from=build /usr/src/app/apps/runner/dist /prod/runner/dist
WORKDIR /prod/runner
EXPOSE 12000
CMD ["node", "--enable-source-maps", "dist/src/main.js"]
