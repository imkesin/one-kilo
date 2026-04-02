/**
 * Client component:
 *
 * AriaKit's `render` prop passes a function, which can't be serialized across the server/client boundary.
 */
"use client"

import { ChevronRight } from "lucide-react"
import { signInRouteUrl } from "~/app/(auth)/sign-in/url"
import { hstack } from "~/generated/styled-system/patterns"
import { Button } from "~/ui/components/button/Button"

export function HomeHeaderNavigation() {
  return (
    <nav className={hstack({ justifyContent: "end" })}>
      <Button render={(props) => <a {...props} href={signInRouteUrl} />}>
        Sign in
        <ChevronRight size={20} />
      </Button>
    </nav>
  )
}
