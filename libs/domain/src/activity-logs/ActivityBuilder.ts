import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import type { UUIDv7 } from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"

const TypeId = "~@one-kilo/domain/ActivityBuilder" as const
type TypeId = typeof TypeId

type ActivityMetadataFields<ActivityType extends string, Targets extends S.Schema.All = S.Schema.All> = {
  readonly actorId: typeof UserId
  readonly targets: Targets
  readonly timestamp: typeof S.DateTimeUtc

  readonly _type: S.PropertySignature<":", ActivityType, never, ":", ActivityType, true, never>
  readonly _traceId: typeof S.NonEmptyTrimmedString
}

interface ActivityBuilder<Targets extends S.Schema.All> {
  readonly [TypeId]: TypeId

  Activity: <ActivityType extends string>(
    activityType: ActivityType
  ) => ActivityMetadataFields<ActivityType, Targets>

  ActivityWithContext: <ActivityType extends string, Context extends S.Schema.All>(
    activityType: ActivityType,
    context: Context
  ) => { context: Context } & ActivityMetadataFields<ActivityType, Targets>
}

type DerivedTargetId<TargetType extends string> = S.brand<typeof UUIDv7, `@one-kilo/domain/${TargetType}Id`>
type Target<T extends string = string> = { type: T; id: DerivedTargetId<T> }

export function make<A extends string>(
  target: Target<A>
): ActivityBuilder<S.Tuple<readonly [S.Struct<{ id: typeof target["id"]; type: S.tag<typeof target["type"]> }>]>>
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

    Activity: <ActivityType extends string>(activityType: ActivityType) => ({
      actorId: UserId,
      targets,
      timestamp: S.DateTimeUtc,

      _type: pipe(
        S.tag(activityType),
        S.withConstructorDefault(() => activityType)
      ),
      _traceId: S.NonEmptyTrimmedString
    }),
    ActivityWithContext: <ActivityType extends string, Context extends S.Schema.All>(
      activityType: ActivityType,
      context: Context
    ) => ({
      actorId: UserId,
      context,
      targets,
      timestamp: S.DateTimeUtc,

      _type: pipe(
        S.tag(activityType),
        S.withConstructorDefault(() => activityType)
      ),
      _traceId: S.NonEmptyTrimmedString
    })
  }
}
