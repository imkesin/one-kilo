import { css, cx } from "~/ui/generated/styled-system/css"
import { hstack, vstack } from "~/ui/generated/styled-system/patterns"
import type { NavItem } from "./types"

type Variant = "bar" | "rail"

/*
 * `bar` = stacked icon-over-label cell for the mobile bottom bar. `rail` = horizontal
 * icon-then-label row for the desktop sidebar and the More sheet.
 */
const baseClass: Record<Variant, string> = {
  bar: vstack({
    gap: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: 2,
    fontSize: "2xs",
    lineHeight: 1,
    lightDarkColor: "grey.text",
    cursor: "pointer",
    _hover: { lightDarkColor: "grey.text.emphasized" }
  }),
  rail: hstack({
    gap: 3,
    alignItems: "center",
    paddingInline: 3,
    paddingBlock: 2,
    borderRadius: "md",
    fontSize: "sm",
    lightDarkColor: "grey.text",
    cursor: "pointer",
    _hover: { lightDarkBg: "grey.3", lightDarkColor: "grey.text.emphasized" }
  })
}

const activeClass: Record<Variant, string> = {
  bar: css({ lightDarkColor: "accent.text" }),
  rail: css({ lightDarkBg: "accent.3", lightDarkColor: "accent.text" })
}

const disabledClass = css({ opacity: 0.4, cursor: "default", pointerEvents: "none" })

type NavEntryProps = {
  item: NavItem
  variant: Variant
  /* Forwarded to the injected link (e.g. to dismiss the More sheet on navigation). */
  onClick?: () => void
}

export function NavEntry({ item, variant, onClick }: NavEntryProps) {
  const Icon = item.icon
  const className = cx(baseClass[variant], item.active && activeClass[variant])
  const inner = (
    <>
      <Icon size={variant === "bar" ? 22 : 20} />
      <span>{item.label}</span>
    </>
  )

  if (!item.renderLink) {
    return (
      <button type="button" disabled aria-label={item.label} className={cx(className, disabledClass)}>
        {inner}
      </button>
    )
  }

  return item.renderLink({
    className,
    "aria-current": item.active ? "page" : undefined,
    onClick,
    children: inner
  })
}
