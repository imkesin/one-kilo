import { Result, useAtomValue } from "@effect-atom/atom-react"
import { createFileRoute } from "@tanstack/react-router"
import { meAtom } from "~/modules/users/usersAtoms"

function UserPage() {
  const me = useAtomValue(meAtom)

  return (
    <div>
      <h1>User Page</h1>
      {Result.builder(me)
        .onWaiting(() => <p>Loading…</p>)
        .onFailure(() => <p>Couldn’t load your profile.</p>)
        .onSuccess(({ user }) => {
          switch (user._tag) {
            case "User:Person":
              return (
                <dl>
                  <dt>Name</dt>
                  <dd>{user.person.fullName}</dd>
                  <dt>Email</dt>
                  <dd>{user.person.emailAddresses[0].value}</dd>
                </dl>
              )
            case "User:MachineClient":
              return (
                <dl>
                  <dt>Machine client</dt>
                  <dd>{user.machineClient.name}</dd>
                </dl>
              )
          }
        })
        .render()}
    </div>
  )
}

export const Route = createFileRoute("/_app/u/$userId")({
  component: UserPage
})
