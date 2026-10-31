import { PersonVersion } from "@one-kilo/domain/versions/PersonVersion"
import * as ClusterSchema from "effect/cluster/ClusterSchema"
import * as ClusterEntity from "effect/cluster/Entity"
import { pipe } from "effect/Function"
import * as Rpc from "effect/rpc/Rpc"
import * as S from "effect/Schema"

export const PushUpdateOutcome = S.Literals([
  "AccountUnlinked",
  "AlreadySynced",
  "DriftDetected",
  "Updated"
])

export const PushUpdate = Rpc.make(
  "PushUpdate",
  {
    payload: {
      expected: pipe(
        S.Struct({
          firstName: S.Trimmed.check(S.isNonEmpty()),
          lastName: pipe(
            S.Trimmed.check(S.isNonEmpty()),
            S.NullOr
          )
        }),
        S.annotate({
          description:
            "The WorkOS user's name before the change. A mismatch at push time means the user was changed in WorkOS since."
        })
      ),
      personVersion: pipe(
        PersonVersion,
        S.annotate({
          description:
            "The person version produced by the change being pushed. Used as the primary key — one push per version."
        })
      )
    },
    success: PushUpdateOutcome,
    primaryKey: ({ personVersion }) => `${personVersion}`
  }
)

/**
 * Person updates headed for the linked WorkOS user, one outbox per person (the entity ID is the
 * person ID). Updates for a person are pushed strictly in order; the WorkOS user is resolved at
 * push time, not at send time.
 */
export const Entity = ClusterEntity
  .make("PersonToWorkOSOutbox", [PushUpdate])
  .annotateRpcs(ClusterSchema.Persisted, true)
