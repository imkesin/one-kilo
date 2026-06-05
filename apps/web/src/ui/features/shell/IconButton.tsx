import * as Ariakit from "@ariakit/react"
import type { PropsWithChildren } from "react"
import { css } from "~/ui/generated/styled-system/css"
import type { RenderNavLink } from "./types"

type IconButtonProps = PropsWithChildren<{
  label: string
  /* When present the button navigates via the app-injected link; otherwise it is a plain button. */
  renderLink?: RenderNavLink | undefined
  onClick?: (() => void) | undefined
}>

const iconButtonClass = css({
  display: "inline-grid",
  placeItems: "center",
  width: 10,
  height: 10,
  borderRadius: "md",
  lightDarkColor: "grey.text",
  cursor: "pointer",
  _hover: { lightDarkBg: "grey.3", lightDarkColor: "grey.text.emphasized" },
  _disabled: { opacity: 0.4, cursor: "default", _hover: { background: "transparent" } }
})

export function IconButton({ label, renderLink, onClick, children }: IconButtonProps) {
  if (renderLink) {
    return renderLink({ className: iconButtonClass, "aria-label": label, title: label, onClick, children })
  }

  return (
    <Ariakit.Button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={!onClick}
      className={iconButtonClass}
    >
      {children}
    </Ariakit.Button>
  )
}
