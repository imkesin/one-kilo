import { hstack } from "~/generated/styled-system/patterns"
import { SignInButton } from "~/ui/components/auth/SignInButton"

export function HomeHeaderNavigation() {
  return (
    <nav className={hstack({ justifyContent: "end" })}>
      <SignInButton />
    </nav>
  )
}
