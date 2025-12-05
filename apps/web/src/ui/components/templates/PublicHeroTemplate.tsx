import type { PropsWithChildren } from "react"
import { cq, vstack } from "~/generated/styled-system/patterns"

export function PublicHeroTemplate({ children }: PropsWithChildren) {
  return (
    <section
      className={cq({
        display: "grid",
        bgLinear: "to-b",
        lightDarkGradientFrom: "grey.bg",
        lightDarkGradientTo: "grey.bg.canvas",
        gradientFromPosition: "10%",
        gradientToPosition: "90%",
        paddingBlock: 16
      })}
    >
      <div
        className={vstack({
          display: "grid",
          paddingInline: 4,
          paddingBlock: 32,
          "@/6xl": {
            width: "6xl",
            mx: "auto"
          }
        })}
      >
        {children}
      </div>
    </section>
  )
}
