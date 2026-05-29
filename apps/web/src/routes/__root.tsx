import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import type { PropsWithChildren } from "react"

import "@fontsource/fira-sans/latin-300.css"
import "@fontsource/fira-sans/latin-400.css"
import "@fontsource/fira-sans/latin-500.css"
import "@fontsource/fira-sans/latin-600.css"
import "@fontsource/fira-sans/latin-700.css"

import "@fontsource/fira-mono/latin-400.css"
import "@fontsource/fira-mono/latin-500.css"

import appCss from "~/styles/globals.css?url"
import { Body } from "~/ui/components/root/Body"

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <Body>
        {children}
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
        name: "viewport",
        content: "width=device-width, initial-scale=1"
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
