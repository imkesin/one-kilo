import * as Ariakit from "@ariakit/react"
import { Menu } from "lucide-react"
import { css } from "~/ui/generated/styled-system/css"
import { vstack } from "~/ui/generated/styled-system/patterns"
import { NavEntry } from "./NavEntry"
import type { NavItem } from "./types"

type MoreSheetProps = {
  items: ReadonlyArray<NavItem>
}

/*
 * The mobile bottom-bar overflow. The disclosure is itself a bottom-bar cell (matches the bar
 * variant), and the panel is a bottom sheet anchored to the dynamic bottom edge with safe-area
 * padding so it clears the home indicator.
 */
export function MoreSheet({ items }: MoreSheetProps) {
  const dialog = Ariakit.useDialogStore()

  return (
    <>
      <Ariakit.DialogDisclosure
        store={dialog}
        className={vstack({
          gap: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingBlock: 2,
          fontSize: "2xs",
          lineHeight: 1,
          lightDarkColor: "grey.text",
          cursor: "pointer",
          _hover: { lightDarkColor: "grey.text.emphasized" }
        })}
      >
        <Menu size={22} />
        <span>More</span>
      </Ariakit.DialogDisclosure>

      <Ariakit.Dialog
        store={dialog}
        backdrop={<div className={css({ position: "fixed", inset: 0, background: "black/40" })} />}
        className={css({
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          zIndex: 50,
          lightDarkBg: "grey.bg",
          borderTopRadius: "xl",
          borderTopWidth: 1,
          lightDarkBorderColor: "grey.6",
          paddingInline: 4,
          paddingTop: 4,
          paddingBottom: "calc(token(spacing.4) + env(safe-area-inset-bottom))"
        })}
      >
        <Ariakit.DialogHeading
          className={css({ fontWeight: 600, marginBottom: 3, lightDarkColor: "grey.text.emphasized" })}
        >
          More
        </Ariakit.DialogHeading>
        <div className={vstack({ alignItems: "stretch", gap: 1 })}>
          {items.map((item) => <NavEntry key={item.id} item={item} variant="rail" onClick={dialog.hide} />)}
        </div>
      </Ariakit.Dialog>
    </>
  )
}
