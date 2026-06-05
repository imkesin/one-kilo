import type { LinkProps } from "@tanstack/react-router"
import { Bell, CalendarDays, ChartColumn, CircleHelp, Home, NotebookPen, Settings, User } from "lucide-react"
import type { ComponentType } from "react"

/*
 * App data: which routes are the shell's nav destinations. Lives in the routes tree (not `ui/`,
 * which is data/route-agnostic) and is colocated with the `_app` composition root. The `-shell`
 * directory is ignored by TanStack's route generator (the default `-` ignore prefix).
 */
export type Destination = {
  readonly id: string
  readonly label: string
  readonly icon: ComponentType<{ size?: number | string }>
  /*
   * Target route, typed against the router's route union. Omit until the route exists — the shell
   * renders such entries as disabled placeholders.
   */
  readonly to?: LinkProps["to"]
}

export type Destinations = {
  readonly primary: ReadonlyArray<Destination>
  readonly more: ReadonlyArray<Destination>
  readonly settings: Destination
}

/* TODO(product): set `to` on each entry (and create the matching `_app` routes) to wire navigation. */
export const destinations: Destinations = {
  primary: [
    { id: "home", label: "Home", icon: Home },
    { id: "plan", label: "Plan", icon: CalendarDays },
    { id: "log", label: "Log", icon: NotebookPen },
    { id: "stats", label: "Stats", icon: ChartColumn }
  ],
  more: [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "help", label: "Help", icon: CircleHelp }
  ],
  settings: { id: "settings", label: "Settings", icon: Settings }
}
