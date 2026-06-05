import { css } from "~/ui/generated/styled-system/css"
import { vstack } from "~/ui/generated/styled-system/patterns"
import { MoreSheet } from "./MoreSheet"
import { NavEntry } from "./NavEntry"
import type { NavConfig } from "./types"

type AppNavProps = {
  config: NavConfig
}

/*
 * Both presentations render and are CSS-toggled at the shell breakpoint (@/3xl) — never
 * JS-selected — so SSR is deterministic and there is no flash-of-wrong-nav. They share the same
 * `config` data (single source of truth), differing only in layout. Both occupy grid-area `nav`;
 * only one is displayed at a time.
 */
export function AppNav({ config }: AppNavProps) {
  return (
    <>
      <nav
        aria-label="Primary"
        className={css({
          gridArea: "nav",
          display: { base: "grid", "@/3xl": "none" },
          gridAutoFlow: "column",
          gridAutoColumns: "1fr",
          lightDarkBg: "grey.bg",
          borderTopWidth: 1,
          lightDarkBorderColor: "grey.6",
          paddingBottom: "env(safe-area-inset-bottom)"
        })}
      >
        {config.primary.map((item) => <NavEntry key={item.id} item={item} variant="bar" />)}
        <MoreSheet items={config.more} />
      </nav>

      <nav
        aria-label="Primary"
        className={css({
          gridArea: "nav",
          display: { base: "none", "@/3xl": "grid" },
          /* Header row matches the topbar's height so the items row aligns with main content. */
          gridTemplateRows: "auto 1fr",
          height: "100%",
          width: "15rem",
          lightDarkBg: "grey.bg",
          borderInlineEndWidth: 1,
          lightDarkBorderColor: "grey.6"
        })}
      >
        {
          /*
           * Header: topbar height (IconButton `height: 10` + `paddingBlock: 3`); border continues the
           * topbar's bottom border. +1px because the topbar is auto-height (its border adds below 4rem)
           * while this fixed-height border-box would otherwise absorb its own border.
           */
        }
        <div
          className={css({
            height: "calc(token(spacing.10) + token(spacing.3) * 2 + 1px)",
            borderBottomWidth: 1,
            lightDarkBorderColor: "grey.6"
          })}
        />
        <div className={vstack({ alignItems: "stretch", gap: 1, padding: 3 })}>
          {[...config.primary, ...config.more].map((item) => <NavEntry key={item.id} item={item} variant="rail" />)}
          <div className={css({ marginTop: "auto" })} />
          <NavEntry item={config.settings} variant="rail" />
        </div>
      </nav>
    </>
  )
}
