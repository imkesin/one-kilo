import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import type { ComponentProps } from "react"
import { Button } from "~/ui/components/button/Button"

type SignInButtonProps = Omit<ComponentProps<typeof Button>, "render" | "children">

/*
 * Entry point into the server-driven sign-in flow.
 *
 * `/sign-in` is a server-only route (no client component) whose GET handler
 * builds the WorkOS authorization URL and returns a 302. Reaching it requires a
 * full-document request — a plain client-side `<Link>` would attempt an SPA
 * transition, find no component to render, and 404.
 *
 * The `<Link>` target and `reloadDocument` are pinned here (via the Button's
 * render prop) so call sites neither need to know about that behavior nor can
 * accidentally disable it.
 */
export function SignInButton(props: SignInButtonProps) {
  return (
    <Button
      {...props}
      render={(buttonProps) => (
        <Link
          {...buttonProps}
          to="/sign-in"
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
