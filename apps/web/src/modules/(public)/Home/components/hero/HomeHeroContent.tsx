import { css } from "~/generated/styled-system/css"

export function HomeHeroContent() {
  return (
    <div>
      <h1
        className={css({
          maxW: "3xl",
          fontWeight: "bold",
          lightDarkColor: "grey.12",
          lineHeight: "none",

          fontSize: "4xl",
          mb: 4,
          "@/6xl": {
            fontSize: "6xl",
            mb: 6
          }
        })}
      >
        Example Application
      </h1>
      <p
        className={css({
          fontSize: "xl",
          maxW: "3xl",
          lightDarkColor: "grey.11",
          "@/6xl": {
            fontSize: "2xl"
          }
        })}
      >
        See how you can integrate WorkOS to build something interesting.
      </p>
    </div>
  )
}
