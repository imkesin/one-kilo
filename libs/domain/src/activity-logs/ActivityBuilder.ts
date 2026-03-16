import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import type { UUIDv7 } from "@one-kilo/lib/uuid/UUIDv7"
import * as S from "effect/Schema"
import { ActivityLogId } from "../ids/ActivityLogId.ts"
import { UserId } from "../ids/UserId.ts"

const TypeId = "~@one-kilo/domain/ActivityBuilder" as const
type TypeId = typeof TypeId

type Version = 1 | 2 | 3

type ActivityMetadataFields<Type extends string, Targets extends S.Schema.All = S.Schema.All> = {
  // Inputs
  readonly id: typeof ActivityLogId
  readonly actorId: typeof UserId
  readonly targets: Targets

  // Derived
  readonly timestamp: typeof S.DateTimeUtc
  readonly traceId: typeof S.NonEmptyTrimmedString

  // Inferred
  readonly type: S.tag<Type>
  readonly version: S.tag<Version>
}

interface ActivityBuilder<Targets extends S.Schema.All> {
  readonly [TypeId]: TypeId

  Activity: <Type extends string>(
    type: Type
  ) => ActivityMetadataFields<Type, Targets>

  ActivityWithContext: <Type extends string, Context extends S.Schema.All>(
    type: Type,
    context: Context
  ) => ActivityMetadataFields<Type, Targets> & { context: Context }
}

type Target<T extends string = "Unknown"> = {
  id: S.brand<
    typeof UUIDv7,
    `@one-kilo/domain/${T}Id`
  >
  type: T
}

export function make<A extends string>(
  target: Target<A>
): ActivityBuilder<
  S.Tuple<
    readonly [
      S.Struct<{ id: typeof target["id"]; type: S.tag<typeof target["type"]> }>
    ]
  >
>
export function make<
  A extends string,
  B extends string
>(
  targetA: Target<A>,
  targetB: Target<B>
): ActivityBuilder<
  S.Tuple<
    readonly [
      S.Struct<{ id: typeof targetA["id"]; type: S.tag<typeof targetA["type"]> }>,
      S.Struct<{ id: typeof targetB["id"]; type: S.tag<typeof targetB["type"]> }>
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
): ActivityBuilder<
  S.Tuple<
    readonly [
      S.Struct<{ id: typeof targetA["id"]; type: S.tag<typeof targetA["type"]> }>,
      S.Struct<{ id: typeof targetB["id"]; type: S.tag<typeof targetB["type"]> }>,
      S.Struct<{ id: typeof targetC["id"]; type: S.tag<typeof targetC["type"]> }>
    ]
  >
>
export function make(
  targetA: Target,
  targetB?: Target,
  targetC?: Target
): unknown {
  let targets: S.Schema.All
  switch (arguments.length) {
    case 1: {
      targets = S.Tuple(S.Struct({ id: targetA.id, type: S.tag(targetA.type) }))

      break
    }
    case 2: {
      targets = S.Tuple(
        S.Struct({ id: targetA.id, type: S.tag(targetA.type) }),
        S.Struct({ id: targetB!.id, type: S.tag(targetB!.type) })
      )

      break
    }
    case 3: {
      targets = S.Tuple(
        S.Struct({ id: targetA.id, type: S.tag(targetA.type) }),
        S.Struct({ id: targetB!.id, type: S.tag(targetB!.type) }),
        S.Struct({ id: targetC!.id, type: S.tag(targetC!.type) })
      )

      break
    }
    default: {
      throw new UnexpectedError({ message: "Invalid number of arguments" })
    }
  }

  return {
    [TypeId]: TypeId,

    Activity: <Type extends string>(
      parameters: {
        type: Type
        version?: Version
      }
    ) => ({
      id: ActivityLogId,
      actorId: UserId,
      targets,

      timestamp: S.DateTimeUtc,
      traceId: S.NonEmptyTrimmedString,

      type: S.tag(parameters.type),
      version: S.tag(parameters.version ?? 1)
    }),
    ActivityWithContext: <Type extends string, Context extends S.Schema.All>(
      parameters: {
        type: Type
        context: Context
        version?: Version
      }
    ) => ({
      id: ActivityLogId,
      actorId: UserId,
      context: parameters.context,
      targets,

      timestamp: S.DateTimeUtc,
      traceId: S.NonEmptyTrimmedString,

      type: S.tag(parameters.type),
      version: S.tag(parameters.version ?? 1)
    })
  }
}
