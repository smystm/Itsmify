"use client"

import type { Dispatch, SetStateAction } from "react"
import { createContext, useContext } from "react"
import type { SessionUser } from "@/lib/auth/session"

/**
 * Panel-only display context. It's not connection-level session truth, it's
 * the in-memory copy of `SessionUser` that the client header may render while
 * a write-path hasn't finished updating the server cache. Fits the
 * "client shell is never the authorization source" principle: it exists
 * purely to smooth one line of text during the few hundred_ms window
 * between a successful PATCH and `router.refresh()`.
 */
interface UserDisplayContextValue {
   user: SessionUser
   setUser: Dispatch<SetStateAction<SessionUser>>
}

export const UserDisplayContext = createContext<UserDisplayContextValue | null>(null)

/**
 * Fallback: if a shell doesn't provide the user-object stitch-in, the caller
 * passes `user` directly as a prop and behaves like the pre-context shell.
 */
export function useUserDisplay(): UserDisplayContextValue | null {
   return useContext(UserDisplayContext)
}

/** Sets a user value on the context, or a no-op if the shell didn't provide one. */
export function useUserDisplaySetter(): Dispatch<SetStateAction<SessionUser>> {
   const context = useContext(UserDisplayContext)
   return context?.setUser ?? (() => {})
}
