import { createFileRoute } from "@tanstack/react-router"
import { css } from "~/ui/generated/styled-system/css"

/*
 * TODO: inverse gate — once `me` carries an onboarding-complete flag, redirect already-onboarded
 * users back into the app (`/` or the app home) from a `beforeLoad` here.
 */
function OnboardingPage() {
  return (
    <div
      className={css({
        blockSize: "100%",
        overflowBlock: "auto",
        display: "grid",
        placeItems: "center",
        padding: "6"
      })}
    >
      <h1>Onboarding {/* TODO: build the onboarding steps */}</h1>
    </div>
  )
}

export const Route = createFileRoute("/_authed/onboarding")({
  component: OnboardingPage
})
