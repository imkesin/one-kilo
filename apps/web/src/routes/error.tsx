import { createFileRoute } from "@tanstack/react-router"
import { FatalErrorScreen } from "~/ui/components/error/FatalErrorScreen"

/*
 * Must stay static — no loader or server Effect. A fatal in one would redirect
 * back here, looping (`/error` fails -> 303 to `/error` -> ...).
 */
export const Route = createFileRoute("/error")({
  component: () => <FatalErrorScreen variant="terminal" />
})
