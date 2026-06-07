import { Link } from "@tanstack/react-router"
import { Home } from "lucide-react"
import type { PropsWithChildren } from "react"
import { css } from "~/ui/generated/styled-system/css"

export function AppFrame({ children }: PropsWithChildren) {
  return (
    <div
      className={css({
        display: "grid",
        blockSize: "100%",
        gridTemplateRows: "1fr auto",
        gridTemplateAreas: `"main" "nav"`
      })}
    >
      <main
        // Stable selector for TanStack scroll restoration; the document itself never scrolls.
        data-scroll-restoration-id="app-main"
        className={css({
          gridArea: "main",
          overflowBlock: "auto",
          overscrollBehavior: "contain",
          minBlockSize: 0,
          minInlineSize: 0
        })}
      >
        {children}
      </main>
      <nav
        aria-label="Primary"
        className={css({
          gridArea: "nav",
          display: "flex",
          justifyContent: "center",
          lightDarkBg: "grey.bg",
          borderTopWidth: 1,
          lightDarkBorderColor: "grey.6",
          paddingBottom: "env(safe-area-inset-bottom)"
        })}
      >
        <Link
          to="/"
          aria-current="page"
          className={css({
            display: "inline-grid",
            placeItems: "center",
            gap: 1,
            paddingBlock: 2,
            paddingInline: 6,
            fontSize: "2xs",
            lineHeight: 1,
            lightDarkColor: "accent.text"
          })}
        >
          <Home size={22} />
          <span>Dashboard</span>
        </Link>
      </nav>
    </div>
  )
}
