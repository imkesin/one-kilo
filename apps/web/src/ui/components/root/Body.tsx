import type { PropsWithChildren } from "react"
import { css } from "~/generated/styled-system/css"

export function Body({ children }: PropsWithChildren) {
  return (
    <body
      className={css({
        /*
         * The css `light-dark()` function relies on setting the `color-scheme` property. The
         * class-based override can be used in the future for toggling between themes.
         */
        colorScheme: {
          _light: "light",
          _osLight: { _dark: "dark", base: "light" },
          base: "dark"
        }
      })}
    >
      {children}
    </body>
  )
}
