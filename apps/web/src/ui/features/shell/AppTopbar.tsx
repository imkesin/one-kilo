import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { css } from "~/ui/generated/styled-system/css"
import { hstack } from "~/ui/generated/styled-system/patterns"
import { IconButton } from "./IconButton"
import type { NavConfig } from "./types"

function formatToday() {
  return new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

/*
 * Rendered on the client to avoid a server/client timezone mismatch: the server may format "today"
 * in a different zone than the visitor. The effect re-stamps it with the client's zone after mount.
 */
function TodayLabel() {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => setLabel(formatToday()), [])
  return (
    <span suppressHydrationWarning className={css({ fontWeight: 600, lightDarkColor: "grey.text.emphasized" })}>
      {label ?? formatToday()}
    </span>
  )
}

type AppTopbarProps = {
  config: NavConfig
}

/*
 * Mobile = [gear · date · bell]; desktop = [date · bell] (the gear lives in the sidebar there).
 * Both render and are CSS-toggled at @/3xl. Notifications are a deferred transient overlay, so the
 * bell is a no-op IconButton for now.
 */
export function AppTopbar({ config }: AppTopbarProps) {
  const SettingsIcon = config.settings.icon
  return (
    <header
      className={css({
        gridArea: "top",
        lightDarkBg: "grey.bg",
        borderBottomWidth: 1,
        lightDarkBorderColor: "grey.6"
      })}
    >
      <div
        className={hstack({
          display: { base: "flex", "@/3xl": "none" },
          justifyContent: "space-between",
          alignItems: "center",
          paddingInline: 4,
          paddingBottom: 2,
          paddingTop: "calc(token(spacing.2) + env(safe-area-inset-top))"
        })}
      >
        <IconButton label="Settings" renderLink={config.settings.renderLink}>
          <SettingsIcon size={20} />
        </IconButton>
        <TodayLabel />
        <IconButton label="Notifications">
          <Bell size={20} />
        </IconButton>
      </div>

      <div
        className={hstack({
          display: { base: "none", "@/3xl": "flex" },
          justifyContent: "space-between",
          alignItems: "center",
          paddingInline: 6,
          paddingBlock: 3
        })}
      >
        <TodayLabel />
        <IconButton label="Notifications">
          <Bell size={20} />
        </IconButton>
      </div>
    </header>
  )
}
