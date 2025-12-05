import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { css } from "~/generated/styled-system/css"
import { HStack } from "~/generated/styled-system/jsx"
import { hstack } from "~/generated/styled-system/patterns"
import { Button } from "~/ui/components/button/Button"

function Navigation() {
  return (
    <nav className={hstack({ justifyContent: "end" })}>
      <Button render={<Link href="/" />}>
        Sign in
        <ChevronRight size={20} />
      </Button>
    </nav>
  )
}

export function HomeHeaderContent() {
  return (
    <HStack justifyContent="space-between">
      <span
        className={css({
          fontSize: "xl",
          fontWeight: "bold",
          lightDarkColor: "grey.12"
        })}
      >
        WorkOS + Effect
      </span>
      <Navigation />
    </HStack>
  )
}
