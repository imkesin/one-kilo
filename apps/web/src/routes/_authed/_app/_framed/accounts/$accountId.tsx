import { Result, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute } from "@tanstack/react-router"
import { whoamiAtom } from "~/modules/whoami/whoamiAtoms"

function AccountPage() {
  const whoami = useAtomValue(whoamiAtom)

  return (
    <div>
      <h1>Account Page</h1>
      {Result.builder(whoami)
        .onWaiting(() => <p>Loading…</p>)
        .onFailure(() => <p>Couldn’t load your profile.</p>)
        .onSuccess(({ account }) => {
          switch (account._tag) {
            case "Account:Person":
              return (
                <dl>
                  <dt>Name</dt>
                  <dd>{account.person.fullName}</dd>
                  <dt>Email</dt>
                  <dd>{account.person.emailAddresses[0].value}</dd>
                </dl>
              )
            case "Account:MachineClient":
              return (
                <dl>
                  <dt>Machine client</dt>
                  <dd>{account.machineClient.name}</dd>
                </dl>
              )
          }
        })
        .render()}
    </div>
  )
}

export const Route = createFileRoute("/_authed/_app/_framed/accounts/$accountId")({
  component: AccountPage
})
