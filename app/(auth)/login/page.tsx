import type { Metadata } from "next"
import AuthShell from "@/app/components/ui/AuthShell"
import Yokoso from "@/app/components/auth/Yokoso"
import LoginForm from "@/app/components/auth/LoginForm"
import { fa } from "@/lib/i18n/fa"

export const metadata: Metadata = {
   title: fa.authPages.loginMetaTitle,
   description: fa.authPages.loginMetaDescription,
}

/**
 * Sign-in: username + password → session. Static shell plus a client form; the
 * signed-in-redirect decision happens in proxy.ts, not here.
 */
export default function LoginPage() {
   return (
      <AuthShell>
         <Yokoso paraKoso={fa.authPages.loginSubtitle} />
         <LoginForm />
      </AuthShell>
   )
}
