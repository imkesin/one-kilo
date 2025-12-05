import type { PropsWithChildren } from "react"
import { cq, vstack } from "~/generated/styled-system/patterns"

export function PublicFooterTemplate({ children }: PropsWithChildren) {
  return (
    <footer
      className={cq({
        lightDarkBg: "grey.bg.canvas",
        color: "grey.text",
        borderTopWidth: 1,
        lightDarkBorderColor: "grey.6"
      })}
    >
      <div
        className={vstack({
          display: "grid",
          paddingBlock: 4,
          paddingInline: 4,
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
    </footer>
  )
}
