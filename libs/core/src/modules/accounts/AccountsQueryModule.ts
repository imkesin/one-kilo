import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { AccountsQueryRepository } from "@one-kilo/sql/modules/accounts/AccountsQueryRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

type RetrieveAccountParameters = {
  readonly accountId: AccountId
}

export class AccountsQueryModule extends Effect.Service<AccountsQueryModule>()(
  "@one-kilo/core/AccountsQueryModule",
  {
    dependencies: [AccountsQueryRepository.Default],
    effect: Effect.gen(function*() {
      const accountsQueryRepository = yield* AccountsQueryRepository

      /**
       * For callers that have already established the account exists (e.g. it is the authenticated
       * actor). A missing row is an invariant violation, so the whole flow dies.
       */
      const retrieveAccountOrDie = Effect.fn("AccountsQueryModule.retrieveAccountOrDie")(
        function*({ accountId }: RetrieveAccountParameters) {
          return yield* pipe(
            accountsQueryRepository.findAccountByAccountId({ accountId }),
            Effect.flatMap(
              Option.match({
                onNone: () => dieWithUnexpectedError("Expected an account to exist but none was found"),
                onSome: Effect.succeed
              })
            ),
            Effect.annotateLogs({ accountId })
          )
        }
      )

      return {
        retrieveAccount: accountsQueryRepository.findAccountByAccountId,
        retrieveAccountOrDie
      }
    })
  }
) {}
