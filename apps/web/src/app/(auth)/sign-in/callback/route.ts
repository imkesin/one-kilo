import { handleAuth } from "@workos-inc/authkit-nextjs"
import { workspacesPageUrl } from "~/app/(app)/w/url"

export const GET = handleAuth({
  returnPathname: workspacesPageUrl,
  baseURL: "http://localhost:3000"
})
