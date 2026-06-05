import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import type { ComponentProps } from "react"
import { Button } from "~/ui/components/button/Button"

type SignInButtonProps = Omit<ComponentProps<typeof Button>, "render" | "children">

export function SignInButton(props: SignInButtonProps) {
  return (
    <Button
      {...props}
      render={(buttonProps) => (
        <Link
          {...buttonProps}
          to="/sign-in"
          /*
           * `reloadDocument` is required b/c this may result in a redirect to WorkOS Authkit; it's not always
           * an in-app navigation.
           */
          reloadDocument
          title="Sign in"
        />
      )}
    >
      Sign in
      <ChevronRight size={20} />
    </Button>
  )
}
