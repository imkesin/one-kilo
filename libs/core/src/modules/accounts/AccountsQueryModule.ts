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

      const retrieveAccount = accountsQueryRepository.findAccountByAccountId

      const retrieveAccountOrDie = Effect.fn("AccountsQueryModule.retrieveAccountOrDie")(
        function*({ accountId }: RetrieveAccountParameters) {
          return yield* pipe(
            retrieveAccount({ accountId }),
            Effect.flatMap(
              Option.match({
                onNone: () => dieWithUnexpectedError("Expected an account to exist but none was found", { accountId }),
                onSome: Effect.succeed
              })
            )
          )
        }
      )

      return {
        retrieveAccount,
        retrieveAccountOrDie
      }
    })
  }
) {}
