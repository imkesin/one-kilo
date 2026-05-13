/**
 * Client component:
 *
 * AriaKit's `render` prop passes a function, which can't be serialized across the server/client boundary.
 */
"use client"

import { ChevronRight } from "lucide-react"
import Link, { type LinkProps } from "next/link"
import { signInRouteUrl } from "~/app/(auth)/sign-in/url"
import { hstack } from "~/generated/styled-system/patterns"
import { Button } from "~/ui/components/button/Button"

export function HomeHeaderNavigation() {
  return (
    <nav className={hstack({ justifyContent: "end" })}>
      {/* `prefetch={false}`: `/sign-in` is a route handler that 302s to WorkOS — prefetching is wasted.*/}
      <Button
        render={(props) => <Link {...(props as LinkProps)} href={signInRouteUrl} prefetch={false} />}
      >
        Sign in
        <ChevronRight size={20} />
      </Button>
    </nav>
  )
}
