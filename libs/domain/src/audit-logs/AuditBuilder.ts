import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import type { UUIDv7 } from "@one-kilo/lib/uuid/UUIDv7"
import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import { AuditLogId } from "../ids/AuditLogId.ts"
import type { AggregateVersion } from "../versions/internal/AggregateVersion.ts"

const TypeId = "~@one-kilo/domain/AuditBuilder" as const
type TypeId = typeof TypeId

type SchemaVersion = 1 | 2 | 3

type AuditMetadataFields<Type extends string, Targets extends S.Top = S.Top> = {
  // Inputs
  readonly id: typeof AuditLogId
  readonly performedByAccountId: typeof AccountId
  readonly targets: Targets

  // Derived
  readonly timestamp: typeof S.DateTimeUtcFromString
  readonly traceId: S.Trimmed

  // Inferred
  readonly type: S.tag<Type>
  readonly schemaVersion: S.tag<SchemaVersion>
}

interface AuditBuilder<Targets extends S.Top> {
  readonly [TypeId]: TypeId

  Audit: <Type extends string>(
    parameters: {
      type: Type
      schemaVersion?: SchemaVersion
    }
  ) => AuditMetadataFields<Type, Targets>

  AuditWithContext: <Type extends string, Context extends S.Top>(
    parameters: {
      type: Type
      context: Context
      schemaVersion?: SchemaVersion
    }
  ) => AuditMetadataFields<Type, Targets> & { context: Context }
}

type Target<T extends string = "Unknown"> = {
  id: S.brand<
    typeof UUIDv7,
    `@one-kilo/domain/${T}Id`
  >
  type: T
  version: S.brand<
    typeof AggregateVersion,
    `@one-kilo/domain/${T}Version`
  >
}

export function make<A extends string>(
  target: Target<A>
): AuditBuilder<
  S.Tuple<
    readonly [
      S.Struct<{ id: typeof target["id"]; type: S.tag<typeof target["type"]>; version: typeof target["version"] }>
    ]
  >
>
export function make<
  A extends string,
  B extends string
>(
  targetA: Target<A>,
  targetB: Target<B>
): AuditBuilder<
  S.Tuple<
    readonly [
      S.Struct<{ id: typeof targetA["id"]; type: S.tag<typeof targetA["type"]>; version: typeof targetA["version"] }>,
      S.Struct<{ id: typeof targetB["id"]; type: S.tag<typeof targetB["type"]>; version: typeof targetB["version"] }>
    ]
  >
>
export function make<
  A extends string,
  B extends string,
  C extends string
>(
  targetA: Target<A>,
  targetB: Target<B>,
  targetC: Target<C>
): AuditBuilder<
  S.Tuple<
    readonly [
      S.Struct<{ id: typeof targetA["id"]; type: S.tag<typeof targetA["type"]>; version: typeof targetA["version"] }>,
      S.Struct<{ id: typeof targetB["id"]; type: S.tag<typeof targetB["type"]>; version: typeof targetB["version"] }>,
      S.Struct<{ id: typeof targetC["id"]; type: S.tag<typeof targetC["type"]>; version: typeof targetC["version"] }>
    ]
  >
>
export function make(
  targetA: Target,
  targetB?: Target,
  targetC?: Target
): unknown {
  let targets: S.Top
  switch (arguments.length) {
    case 1: {
      targets = S.Tuple([S.Struct({ id: targetA.id, type: S.tag(targetA.type), version: targetA.version })])

      break
    }
    case 2: {
      targets = S.Tuple([
        S.Struct({ id: targetA.id, type: S.tag(targetA.type), version: targetA.version }),
        S.Struct({ id: targetB!.id, type: S.tag(targetB!.type), version: targetB!.version })
      ])

      break
    }
    case 3: {
      targets = S.Tuple([
        S.Struct({ id: targetA.id, type: S.tag(targetA.type), version: targetA.version }),
        S.Struct({ id: targetB!.id, type: S.tag(targetB!.type), version: targetB!.version }),
        S.Struct({ id: targetC!.id, type: S.tag(targetC!.type), version: targetC!.version })
      ])

      break
    }
    default: {
      throw new UnexpectedError({ message: "Invalid number of arguments" })
    }
  }

  return {
    [TypeId]: TypeId,

    Audit: <Type extends string>(
      parameters: {
        type: Type
        schemaVersion?: SchemaVersion
      }
    ) => ({
      id: AuditLogId,
      performedByAccountId: AccountId,
      targets,

      timestamp: S.DateTimeUtcFromString,
      traceId: S.Trimmed.check(S.isNonEmpty()),

      type: S.tag(parameters.type),
      schemaVersion: S.tag(parameters.schemaVersion ?? 1)
    }),
    AuditWithContext: <Type extends string, Context extends S.Top>(
      parameters: {
        type: Type
        context: Context
        schemaVersion?: SchemaVersion
      }
    ) => ({
      id: AuditLogId,
      performedByAccountId: AccountId,
      context: parameters.context,
      targets,

      timestamp: S.DateTimeUtcFromString,
      traceId: S.Trimmed.check(S.isNonEmpty()),

      type: S.tag(parameters.type),
      schemaVersion: S.tag(parameters.schemaVersion ?? 1)
    })
  }
}
