import { PersonVersion } from "@one-kilo/domain/versions/PersonVersion"
import * as ClusterSchema from "effect/cluster/ClusterSchema"
import * as ClusterEntity from "effect/cluster/Entity"
import { pipe } from "effect/Function"
import * as Rpc from "effect/rpc/Rpc"
import * as S from "effect/Schema"

export const PersonUpdatedOutcome = S.Literals([
  "AccountUnlinked",
  "AlreadySynced",
  "DriftDetected",
  "Updated"
])

export const PersonUpdated = Rpc.make(
  "PersonUpdated",
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
            "The WorkOS user's name before the change. A mismatch when relaying means the user was changed in WorkOS since."
        })
      ),
      personVersion: pipe(
        PersonVersion,
        S.annotate({
          description: "The person version produced by the update. Used as the primary key — one message per version."
        })
      )
    },
    success: PersonUpdatedOutcome,
    primaryKey: ({ personVersion }) => `${personVersion}`
  }
)

/**
 * Person updates headed for the linked WorkOS user, one outbox per person (the entity ID is the
 * person ID). Updates for a person are relayed strictly in order; the WorkOS user is resolved when
 * relaying, not at send time.
 */
export const PersonToWorkOSOutbox = ClusterEntity
  .make("PersonToWorkOSOutbox", [PersonUpdated])
  .annotateRpcs(ClusterSchema.Persisted, true)
