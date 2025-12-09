import { authkitMiddleware } from "@workos-inc/authkit-nextjs"

export default authkitMiddleware({ redirectUri: "http://localhost:3000/sign-in/callback" })

// Match against pages that require authentication
// Leave this out if you want authentication on every page in your application
export const config = { matcher: ["/w"] }
