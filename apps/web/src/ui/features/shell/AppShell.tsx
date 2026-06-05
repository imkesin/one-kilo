import type { PropsWithChildren } from "react"
import { css } from "~/ui/generated/styled-system/css"
import { cq } from "~/ui/generated/styled-system/patterns"
import { AppNav } from "./AppNav"
import { AppTopbar } from "./AppTopbar"
import type { NavConfig } from "./types"

/*
 * The authenticated app shell.
 *
 * Layout flips from a mobile (stacked, bottom-nav) layout to a desktop (left-sidebar) layout at a
 * single *container-query* breakpoint — `@/3xl` (= `@container (min-width: 48rem)`, ~768px), wide
 * enough for a 15rem labelled rail plus comfortable content. A container query (not a viewport
 * media query) means the shell reacts to the space actually available to it (split-view, resized
 * PWA window, embed) and stays inside the existing `@/` Panda idiom. Panda extracts conditions
 * statically, so the breakpoint is inlined as the literal "@/3xl" at each use rather than aliased.
 *
 * Both the top bar and the nav render their mobile *and* desktop presentations and CSS-toggle
 * between them at `@/3xl`; nothing is JS-selected, so SSR is deterministic and there is no
 * flash-of-wrong-layout. The shared `nav` config (injected by the app) keeps the two
 * presentations from diverging.
 */
export function AppShell({ children, nav }: PropsWithChildren<{ nav: NavConfig }>) {
  return (
    <div
      /*
       * Owns the container context (cq() → container-type: inline-size) and the viewport box.
       * Height is `svh`, not `dvh`/`vh`: the document itself never scrolls (overflow hidden — only
       * `main` scrolls), so the mobile URL bar never collapses and `svh` is the exact, stable
       * visible height. No reflow jank, no bottom-bar gap.
       */
      className={cq({
        height: "100svh",
        overflow: "hidden",
        lightDarkBg: "grey.bg.canvas"
      })}
    >
      <div
        className={css({
          display: "grid",
          height: "100%",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateAreas: `"top" "main" "nav"`,
          "@/3xl": {
            gridTemplateColumns: "auto 1fr",
            gridTemplateRows: "auto 1fr",
            gridTemplateAreas: `"nav top" "nav main"`
          }
        })}
      >
        <AppTopbar config={nav} />
        <main
          /*
           * The only scroll container. `data-scroll-restoration-id` gives TanStack a stable
           * selector to snapshot/restore *this* element across back/forward (the document never
           * scrolls). `min-height/min-width: 0` lets the grid track shrink below content size so
           * overflow can actually trigger.
           */
          data-scroll-restoration-id="app-main"
          className={css({
            gridArea: "main",
            overflowY: "auto",
            overscrollBehavior: "contain",
            minHeight: 0,
            minWidth: 0
          })}
        >
          {children}
        </main>
        <AppNav config={nav} />
      </div>
    </div>
  )
}
