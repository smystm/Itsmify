import type { Metadata } from "next"
import { Suspense } from "react"
import AuthShell from "@/app/components/ui/AuthShell"
import Yokoso from "@/app/components/auth/Yokoso"
import ChangePasswordForm from "@/app/components/auth/ChangePasswordForm"
import { requireSessionUser } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const metadata: Metadata = {
   title: fa.changePassword.metaTitle,
   description: fa.changePassword.metaDescription,
}

/**
 * Session-required password screen. It deliberately sits outside /panel and
 * /admin so the forced-change redirect cannot loop: the panel gate sends
 * pending accounts here, and this page accepts a live session without
 * demanding that the password already be settled.
 */
export default function ChangePasswordPage() {
   return (
      <AuthShell>
         <Suspense fallback={<GateFallback />}>
            <ChangePasswordGate />
         </Suspense>
      </AuthShell>
   )
}

async function ChangePasswordGate() {
   const user = await requireSessionUser("/login")
   return (
      <>
         <Yokoso paraKoso={fa.changePassword.brandHint} />
         <ChangePasswordForm forced={user.mustChangePassword} />
      </>
   )
}

function GateFallback() {
   return (
      <div className="w-full max-w-md animate-pulse space-y-4 rounded-3xl border border-border-subtle bg-surface p-8 shadow-xl">
         <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-400/25" />
         <div className="mx-auto h-6 w-48 rounded-lg bg-brand-400/15" />
         <div className="h-24 rounded-2xl bg-brand-500/10" />
      </div>
   )
}
