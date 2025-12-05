import type { PropsWithChildren } from "react"
import { cq, vstack } from "~/generated/styled-system/patterns"

export function PublicSectionTemplate({ children }: PropsWithChildren) {
  return (
    <section
      className={cq({
        display: "grid",
        lightDarkBg: "grey.bg.canvas",
        lightDarkBorderColor: "grey.6",
        borderTopWidth: 1
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
    </section>
  )
}
