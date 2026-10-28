# Telemetry

OTLP export (traces, metrics, logs) via `effect/observability`, configured by standard `OTEL_*` env
vars (each signal is off unless `OTEL_EXPORTER_OTLP_ENDPOINT` and
`OTEL_{TRACES,METRICS,LOGS}_EXPORTER=otlp` are set).

## Structure (`/src`)

- `configs/` — local collector defaults (see `@one-kilo/local-dev` `otel:setup`).

## Commands

```bash
pnpm build       # tsc
```
