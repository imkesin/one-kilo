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
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      },
      {
        rel: "stylesheet",
        href:
          "https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500&family=Fira+Sans:wght@300;400;500;600;700&display=swap"
      }
    ]
  }),
  shellComponent: RootDocument
})
