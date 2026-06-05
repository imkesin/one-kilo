import "@fontsource/fira-sans/latin-300.css"
import "@fontsource/fira-sans/latin-400.css"
import "@fontsource/fira-sans/latin-500.css"
import "@fontsource/fira-sans/latin-600.css"
import "@fontsource/fira-sans/latin-700.css"

import "@fontsource/fira-mono/latin-400.css"
import "@fontsource/fira-mono/latin-500.css"

import { RegistryProvider } from "@effect-atom/atom-react"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import type { PropsWithChildren } from "react"
import appCss from "~/styles/globals.css?url"
import { Body } from "~/ui/components/root/Body"

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <Body>
        <RegistryProvider>
          {children}
        </RegistryProvider>
        <Scripts />
      </Body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        /*
         * viewport-fit=cover exposes env(safe-area-inset-*) so the shell can pad around the notch and home indicator.
         */
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover"
      },
      { title: "One Kilo" },
      {
        name: "description",
        content: "One Kilo"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootDocument
})
