import { redirect } from "next/navigation"
import { workspacesPageUrl } from "~/app/(app)/w/url"

export const GET = async () => {
  redirect(workspacesPageUrl)
}
