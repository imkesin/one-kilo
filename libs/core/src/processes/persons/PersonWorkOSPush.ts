import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSError from "@effect/auth-workos/domain/Errors"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { PersonsQueryModule } from "../../modules/persons/PersonsQueryModule.ts"

const ID_PREFIX = "@one-kilo/core/PersonWorkOSPush"

type PushParameters = {
  readonly personId: PersonId
  readonly expected: {
    readonly firstName: string
    readonly lastName: string | null
  }
}

export type PushOutcome = Data.TaggedEnum<{
  AccountUnlinked: {}
  AlreadySynced: {}
  /*
   * Another actor changed the WorkOS user since the push was sent. An inbound `user.updated`
   * event should reconcile local state.
   */
  DriftDetected: {}
  Updated: {}
}>
const PushOutcome = Data.taggedEnum<PushOutcome>()

export class TargetedPersonNotFoundError extends S.TaggedError<TargetedPersonNotFoundError>(
  `${ID_PREFIX}/TargetedPersonNotFoundError`
)(
  "TargetedPersonNotFoundError",
  {
    personId: PersonId
  }
) {}

export class WorkOSOperationError extends S.TaggedError<WorkOSOperationError>(
  `${ID_PREFIX}/WorkOSOperationError`
)(
  "WorkOSOperationError",
  {
    operation: S.Literals(["RetrieveUser", "UpdateUser"]),
    cause: WorkOSError.WorkOSCommonError
  }
) {}

export class WorkOSUserNotFoundError extends S.TaggedError<WorkOSUserNotFoundError>(
  `${ID_PREFIX}/WorkOSUserNotFoundError`
)(
  "WorkOSUserNotFoundError",
  {
    cause: S.Defect(),
    workosUserId: WorkOSIds.UserId
  }
) {}

/**
 * Pushes a person's current name to the linked WorkOS user.
 *
 * The WorkOS user is resolved now rather than when the push was sent, so an account unlinked in
 * between aborts instead of updating a stale WorkOS user.
 */
export const push = Effect.fn("PersonWorkOSPush.push")(
  function*({ personId, expected }: PushParameters) {
    const workosGatewayClient = yield* WorkOSApiGateway.ApiGateway
    const personsQueryModule = yield* PersonsQueryModule

    const { person, maybeAccount } = yield* pipe(
      personsQueryModule.retrievePersonEntityWithAccount({ personId }),
      Effect.flatMap(
        Option.match({
          onSome: Effect.succeed,
          onNone: () => TargetedPersonNotFoundError.make({ personId })
        })
      )
    )

    if (Option.isNone(maybeAccount)) {
      return PushOutcome.AccountUnlinked()
    }

    const { workosUserId } = maybeAccount.value

    const workosUser = yield* pipe(
      workosGatewayClient.userManagement.retrieveUser(workosUserId),
      Effect.catchTags({
        "ResourceNotFoundError": (e) =>
          WorkOSUserNotFoundError.make({
            cause: e,
            workosUserId
          }),
        "WorkOSCommonError": (e) =>
          WorkOSOperationError.make({
            cause: e,
            operation: "RetrieveUser"
          })
      })
    )

    const derivedWorkOSName = yield* pipe(
      person.deriveWorkOSName(),
      orDieWithUnexpectedError("Failed to derive a WorkOS name from the person")
    )

    if (
      derivedWorkOSName.firstName === workosUser.firstName
      && derivedWorkOSName.lastName === workosUser.lastName
    ) {
      return PushOutcome.AlreadySynced()
    }

    if (
      expected.firstName !== workosUser.firstName
      || expected.lastName !== workosUser.lastName
    ) {
      return PushOutcome.DriftDetected()
    }

    yield* pipe(
      workosGatewayClient.userManagement.updateUser(
        workosUserId,
        {
          firstName: derivedWorkOSName.firstName,
          lastName: derivedWorkOSName.lastName
        }
      ),
      Effect.catchTags({
        "ResourceNotFoundError": (e) =>
          WorkOSUserNotFoundError.make({
            cause: e,
            workosUserId
          }),
        "WorkOSCommonError": (e) =>
          WorkOSOperationError.make({
            cause: e,
            operation: "UpdateUser"
          })
      })
    )

    return PushOutcome.Updated()
  }
)
