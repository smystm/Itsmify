"use client"

import { useRouter } from "next/navigation"
import { FormikHelpers } from "formik"
import * as yup from "yup"
import { UserIcon } from "@heroicons/react/24/outline"
import AuthCard from "./AuthCard"
import { FormShell } from "./FormShell"
import Button from "@/app/components/ui/Button"
import InputField from "@/app/components/ui/InputField"
import PasswordField from "@/app/components/ui/PasswordField"
import { postJson, ApiError } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"

export interface LoginValues {
   username: string
   password: string
}

const loginSchema = yup.object({
   username: yup.string().trim().required(fa.authPages.usernameRequired),
   password: yup.string().required(fa.authPages.passwordRequired),
})

interface LoginResponse {
   status: "ok"
   mustChangePassword: boolean
}

/**
 * Username + password sign-in. Accounts are provisioned by an administrator;
 * no public registration step exists and the phone number is never a login
 * credential. A first-time password is routed through /change-password before
 * the panel renders.
 */
export default function LoginForm() {
   const router = useRouter()

   const handleSubmit = async (values: LoginValues, helpers: FormikHelpers<LoginValues>) => {
      try {
         const data = await postJson<LoginResponse>("/api/auth/login", {
            username: values.username.trim().toLowerCase(),
            password: values.password,
         })

         router.replace(data.mustChangePassword ? "/change-password" : "/panel")
         router.refresh()
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.code === "RATE_LIMIT") helpers.setErrors({ password: fa.authPages.rateLimited })
            else if (err.code === "SUSPENDED" || err.message === "suspended")
               helpers.setErrors({ username: fa.authPages.accountSuspended })
            else if (err.status === 401 || err.message === "invalid_credentials")
               helpers.setErrors({ password: fa.authPages.invalidCredentials })
            else if (err.errors && Object.keys(err.errors).length) helpers.setErrors(err.errors)
            else helpers.setErrors({ password: fa.authPages.genericError })
         } else {
            console.error("login request failed", err)
            helpers.setErrors({ password: fa.authPages.genericError })
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <AuthCard delay={0.16}>
         <h2 className="text-2xl font-extrabold leading-tight text-navy-950 dark:text-white">{fa.authPages.loginHeading}</h2>
         <p className="mb-6 mt-2 text-[15px] leading-7 text-navy-600 dark:text-navy-300">{fa.authPages.loginSubtitle}</p>

         <FormShell<LoginValues>
            initialValues={{ username: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
         >
            {({ isSubmitting, touched, errors }) => (
               <>
                  <InputField
                     name="username"
                     label={fa.authPages.username}
                     placeholder={fa.authPages.usernamePlaceholder}
                     touched={touched.username}
                     error={errors.username as string | undefined}
                     autoComplete="username"
                     dir="ltr"
                     icon={<UserIcon className="h-5 w-5" aria-hidden="true" />}
                  />

                  <PasswordField
                     name="password"
                     label={fa.authPages.password}
                     placeholder={fa.authPages.passwordPlaceholder}
                     touched={touched.password}
                     error={errors.password as string | undefined}
                     autoComplete="current-password"
                  />

                  <Button type="submit" disabled={isSubmitting} className="mt-2">
                     {isSubmitting ? fa.authPages.pleaseWait : fa.authPages.submitLogin}
                  </Button>

                  <p className="mt-4 text-center text-xs leading-6 text-navy-500 dark:text-navy-400">
                     {fa.authPages.loginAccountHint}
                  </p>
               </>
            )}
         </FormShell>
      </AuthCard>
   )
}
