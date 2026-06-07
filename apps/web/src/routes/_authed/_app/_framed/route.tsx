import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppFrame } from "~/ui/features/frames/AppFrame"

function FramedLayout() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  )
}

export const Route = createFileRoute("/_authed/_app/_framed")({
  component: FramedLayout
})
