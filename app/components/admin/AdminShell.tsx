"use client"

import { useState, type ReactNode } from "react"
import AppShell from "@/app/components/layout/AppShell"
import { UserDisplayContext } from "@/app/components/layout/UserDisplayContext"
import { adminNavSections } from "@/app/lib/nav"
import type { SessionUser } from "@/lib/auth/session"
import { fa } from "@/lib/i18n/fa"

/**
 * Privileged area shell. SYS_ADMIN manages employees and accounts;
 * IT_SPECIALIST/IT_MANAGER manage assets. Same skeleton as the panel, saffron
 * accents so the privileged area reads as specially trusted at a glance. It
 * provides the same user-display context as the panel, so header identity stays
 * in lockstep with a self-profile PATCH no matter which shell is mounted.
 */
export default function AdminShell({ user, children }: { user: SessionUser; children: ReactNode }) {
   const [displayUser, setDisplayUser] = useState(user)

   return (
      <UserDisplayContext.Provider value={{ user: displayUser, setUser: setDisplayUser }}>
         <AppShell
            user={user}
            sections={adminNavSections(user)}
            tone="admin"
            title={fa.admin.metaTitle}
            description={fa.admin.heroDescription}
            small={fa.admin.workspaceLabel}
         >
            {children}
         </AppShell>
      </UserDisplayContext.Provider>
   )
}
