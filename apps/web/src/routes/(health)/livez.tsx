import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(health)/livez")({
  server: {
    handlers: {
      GET: async () => Response.json({ status: "ok" })
    }
  }
})
