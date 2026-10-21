"use client"

import { useState, type ReactNode } from "react"
import AppShell from "@/app/components/layout/AppShell"
import { UserDisplayContext } from "@/app/components/layout/UserDisplayContext"
import { panelNavSections } from "@/app/lib/nav"
import type { SessionUser } from "@/lib/auth/session"
import { fa } from "@/lib/i18n/fa"

/**
 * Signed-in area shell. It uses the generic AppShell with the panel tone so
 * the mobile drawer, sticky header and sidebar stay in lockstep with admin.
 */
export default function PanelShell({ user, children }: { user: SessionUser; children: ReactNode }) {
   const [displayUser, setDisplayUser] = useState(user)

   return (
      <UserDisplayContext.Provider value={{ user: displayUser, setUser: setDisplayUser }}>
         <AppShell
            user={user}
            sections={panelNavSections(displayUser)}
            tone="panel"
            title={fa.panel.metaTitle}
            description={fa.panel.heroDescription}
            small={fa.panel.workspaceLabel}
         >
            {children}
         </AppShell>
      </UserDisplayContext.Provider>
   )
}
