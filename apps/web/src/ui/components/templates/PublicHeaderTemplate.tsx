import type { PropsWithChildren } from "react"
import { cq, hstack } from "~/generated/styled-system/patterns"

export function PublicHeaderTemplate({ children }: PropsWithChildren) {
  return (
    <header
      className={cq({
        display: "grid",
        lightDarkBg: "grey.bg",
        lightDarkBorderColor: "grey.6",
        borderBottomWidth: 1
      })}
    >
      <div
        className={hstack({
          display: "grid",
          paddingInline: 4,
          paddingBlock: 4,
          "@/6xl": {
            width: "6xl",
            mx: "auto",
            lightDarkBorderColor: "grey.6",
            borderInlineWidth: 1
          }
        })}
      >
        {children}
      </div>
    </header>
  )
}
