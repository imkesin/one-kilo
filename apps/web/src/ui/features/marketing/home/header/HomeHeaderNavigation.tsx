import { SignInButton } from "~/ui/features/auth/SignInButton"
import { hstack } from "~/ui/generated/styled-system/patterns"

export function HomeHeaderNavigation() {
  return (
    <nav className={hstack({ justifyContent: "end" })}>
      <SignInButton />
    </nav>
  )
}
