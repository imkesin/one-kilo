import { css } from "~/generated/styled-system/css"
import { HStack } from "~/generated/styled-system/jsx"
import { HomeHeaderNavigation } from "./HomeHeaderNavigation"

export function HomeHeaderContent() {
  return (
    <HStack justifyContent="space-between">
      <span
        className={css({
          fontSize: "xl",
          fontWeight: "bold",
          lightDarkColor: "grey.12"
        })}
      >
        WorkOS + Effect
      </span>
      <HomeHeaderNavigation />
    </HStack>
  )
}
