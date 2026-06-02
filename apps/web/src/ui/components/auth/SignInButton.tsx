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
           * [Required] This may result in a redirect to WorkOS Authkit; not always an in-app navigation.
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
