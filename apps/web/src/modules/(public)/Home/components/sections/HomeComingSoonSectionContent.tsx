import { css } from "~/generated/styled-system/css"

export function HomePageComingSoonSectionContent() {
  return (
    <div>
      <h2
        className={css({
          fontWeight: "bold",
          lightDarkColor: "grey.12",

          fontSize: "2xl",
          mb: 1,

          "@/6xl": {
            fontSize: "3xl",
            mb: 2
          }
        })}
      >
        Under Construction
      </h2>
      <p
        className={css({
          fontSize: "lg",
          lightDarkColor: "grey.text"
        })}
      >
        We're not quite ready.
      </p>
    </div>
  )
}
