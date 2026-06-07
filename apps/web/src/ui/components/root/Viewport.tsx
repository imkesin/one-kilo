import type { PropsWithChildren } from "react"
import { cq } from "~/ui/generated/styled-system/patterns"

export function Viewport({ children }: PropsWithChildren) {
  return (
    <div
      className={cq({
        height: "100svh",
        overflow: "hidden",
        lightDarkBg: "grey.bg.canvas"
      })}
    >
      {children}
    </div>
  )
}
