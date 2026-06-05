import { css } from "~/ui/generated/styled-system/css"
import { HStack } from "~/ui/generated/styled-system/jsx"
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
        One Kilo
      </span>
      <HomeHeaderNavigation />
    </HStack>
  )
}
