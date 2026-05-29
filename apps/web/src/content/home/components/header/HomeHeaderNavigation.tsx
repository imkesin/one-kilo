import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { hstack } from "~/generated/styled-system/patterns"
import { Button } from "~/ui/components/button/Button"

export function HomeHeaderNavigation() {
  return (
    <nav className={hstack({ justifyContent: "end" })}>
      <Button
        render={(props) => (
          <Link
            {...props}
            to="/sign-in"
            reloadDocument
            title="Sign in"
          />
        )}
      >
        Sign in
        <ChevronRight size={20} />
      </Button>
    </nav>
  )
}
