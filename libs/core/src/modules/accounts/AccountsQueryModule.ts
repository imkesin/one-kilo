import { AccountsQueryRepository } from "@one-kilo/sql/modules/accounts/AccountsQueryRepository"
import * as Effect from "effect/Effect"

export class AccountsQueryModule extends Effect.Service<AccountsQueryModule>()(
  "@one-kilo/core/AccountsQueryModule",
  {
    dependencies: [AccountsQueryRepository.Default],
    effect: Effect.gen(function*() {
      const accountsQueryRepository = yield* AccountsQueryRepository

      return {
        retrieveAccount: accountsQueryRepository.findAccountByAccountId
      }
    })
  }
) {}
