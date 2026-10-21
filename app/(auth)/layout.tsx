import type { ReactNode } from "react"

/**
 * Guest-only group. Any page placed under app/(auth)/ is a pre-sign-in screen.
 *
 * The redirect for signed-in users lives in proxy.ts (cookie gate) — this
 * layout stays purely presentational, because with Cache Components a
 * cookies() read at layout top level would either error the build or pin the
 * whole segment behind a request.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
   return <main dir="rtl" lang="fa">{children}</main>
}
